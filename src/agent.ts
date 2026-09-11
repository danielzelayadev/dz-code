/**
 * The agentic loop: sends the conversation to the model, dispatches any tool
 * calls it makes, and repeats until it answers in text.
 */
import Anthropic from "@anthropic-ai/sdk";
import type {
  ContentBlock,
  MessageParam,
  Tool,
  ToolResultBlockParam,
  ToolUseBlock,
} from "@anthropic-ai/sdk/resources/messages";
import { TOOLS, TOOL_LIST } from "./tools";
import { buildConfirmationMessage, confirmAction, type ConfirmFn } from "./confirm";

const MODEL = "claude-sonnet-5";

const SYSTEM_PROMPT =
  "You are a coding assistant with tools for exploring and editing a local " +
  "codebase. Use read_file to see a file's contents, list_directory to see " +
  "what's in a directory (defaults to the current directory), and " +
  "search_files to grep a regex pattern across files in a directory tree. " +
  "Use write_file to create or overwrite a file with new content. Prefer " +
  "read_file, list_directory, or search_files to gather context before " +
  "answering; only use write_file when the user has actually asked for a " +
  "file to be created or changed. Use update_notes to keep PROJECT_NOTES.md " +
  "current — it replaces the whole file, so pass the full revised document " +
  "each time: keep what's still true from the notes shown above under " +
  "'## Project notes', prune what's stale or superseded, and add new " +
  "durable facts (architecture, conventions, past mistakes). Don't use it " +
  "for routine narration of what you just did. Past " +
  "conversation history is not automatically included in your context — if " +
  "you suspect something relevant was already discussed or decided in an " +
  "earlier session, use check_history to search for it rather than " +
  "assuming you have no memory of it. Use edit_file to replace one exact " +
  "snippet of text in an existing file — prefer it over write_file when " +
  "only part of a file needs to change; it fails if old_string isn't found " +
  "exactly once, so make old_string specific enough to be unique. Use " +
  "run_bash to run a shell command (tests, builds, anything the other " +
  "tools can't do). Some actions pause for the user to type 'y' in the " +
  "terminal before they run; if a tool result says the user declined, " +
  "don't just retry the same action — ask them how they'd like to proceed " +
  "or suggest an alternative.";

export interface AgentResult {
  answer: string;
  messages: MessageParam[];
}

/** Drives the agentic loop: ask the model, run any tools it calls, repeat until it answers in text. */
export async function runAgent(
  client: Anthropic,
  question: string,
  systemPrompt: string,
  confirm: ConfirmFn = confirmAction,
): Promise<AgentResult> {
  const messages: MessageParam[] = [{ role: "user", content: question }];

  while (true) {
    const response = await askModel(client, messages, systemPrompt);
    messages.push({ role: "assistant", content: response.content });

    const toolCalls = response.content.filter(isToolUseBlock);
    if (toolCalls.length === 0) {
      return { answer: extractText(response.content), messages };
    }

    const toolResults = await runToolCalls(toolCalls, confirm);
    messages.push({ role: "user", content: toolResults });
  }
}

/**
 * Runs each tool call in order (not in parallel) so that any confirmation
 * prompts they trigger appear one at a time instead of interleaving.
 */
async function runToolCalls(
  toolCalls: ToolUseBlock[],
  confirm: ConfirmFn,
): Promise<ToolResultBlockParam[]> {
  const results: ToolResultBlockParam[] = [];
  for (const toolCall of toolCalls) {
    results.push(await runToolCall(toolCall, confirm));
  }
  return results;
}

/** Builds the system prompt, folding in the project notes file when one exists. */
export function buildSystemPrompt(notes: string | null): string {
  if (!notes) return SYSTEM_PROMPT;
  return `${SYSTEM_PROMPT}\n\n## Project notes\n\n${notes}`;
}

/**
 * Sends the current conversation history to the model, along with the system
 * prompt and the list of available tools, and returns the model's response
 * (which may contain text and/or tool_use blocks for the agent loop to handle).
 */
function askModel(client: Anthropic, messages: MessageParam[], systemPrompt: string) {
  return client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    tools: TOOL_LIST,
    messages,
  });
}

function isToolUseBlock(block: ContentBlock): block is ToolUseBlock {
  return block.type === "tool_use";
}

function extractText(content: ContentBlock[]): string {
  return content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");
}

/** Runs a single tool the model asked for and turns the outcome into a tool_result block. */
async function runToolCall(toolCall: ToolUseBlock, confirm: ConfirmFn): Promise<ToolResultBlockParam> {
  const { name, id } = toolCall;
  const input = toolCall.input as Record<string, unknown>;
  logToolCall(name, input);

  const entry = TOOLS[name];
  if (!entry) {
    return logAndReturnError(id, name, `Unknown tool: ${name}`);
  }

  const missing = missingRequiredArgs(entry.tool, input);
  if (missing.length > 0) {
    return logAndReturnError(id, name, `Missing required argument(s): ${missing.join(", ")}`);
  }

  if (entry.confirmation?.isRequired(input)) {
    const message = buildConfirmationMessage(
      entry.confirmation.summarize(input),
      entry.confirmation.describe(input),
    );
    const approved = await confirm(message);
    if (!approved) {
      return logAndReturnRejection(id, name);
    }
  }

  try {
    const result = entry.handler(input);
    logToolSuccess(name);
    return toolSuccess(id, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return logAndReturnError(id, name, `Error running ${name}: ${message}`);
  }
}

/** Logs a tool's error outcome and turns it into an error tool_result block. */
function logAndReturnError(toolUseId: string, name: string, message: string): ToolResultBlockParam {
  logToolError(name, message);
  return toolError(toolUseId, message);
}

/** Logs a user's decline and turns it into a non-error tool_result block. */
function logAndReturnRejection(toolUseId: string, name: string): ToolResultBlockParam {
  logToolRejection(name);
  return toolRejected(toolUseId);
}

function logToolCall(name: string, input: Record<string, unknown>): void {
  console.log(`→ ${name}(${JSON.stringify(input)})`);
}

function logToolSuccess(name: string): void {
  console.log(`✓ ${name}`);
}

function logToolError(name: string, message: string): void {
  console.error(`✗ ${name}: ${message}`);
}

function logToolRejection(name: string): void {
  console.log(`⊘ ${name} (declined by user)`);
}

function missingRequiredArgs(tool: Tool, input: Record<string, unknown>): string[] {
  const required = (tool.input_schema.required as string[] | undefined) ?? [];
  return required.filter((key) => input[key] === undefined);
}

function toolSuccess(toolUseId: string, content: string): ToolResultBlockParam {
  return { type: "tool_result", tool_use_id: toolUseId, content };
}

function toolError(toolUseId: string, content: string): ToolResultBlockParam {
  return { type: "tool_result", tool_use_id: toolUseId, content, is_error: true };
}

/** Not an error: the action just didn't happen, so the model should adapt rather than retry it as-is. */
function toolRejected(toolUseId: string): ToolResultBlockParam {
  return {
    type: "tool_result",
    tool_use_id: toolUseId,
    content:
      "The user declined this action, so it was not executed. Don't retry it " +
      "unchanged — ask the user how they'd like to proceed, or propose an alternative.",
  };
}
