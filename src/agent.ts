import Anthropic from "@anthropic-ai/sdk";
import type {
  ContentBlock,
  MessageParam,
  Tool,
  ToolResultBlockParam,
  ToolUseBlock,
} from "@anthropic-ai/sdk/resources/messages";
import { TOOLS, TOOL_LIST } from "./tools";

const MODEL = "claude-sonnet-5";

const SYSTEM_PROMPT =
  "You are a coding assistant with tools for exploring and editing a local " +
  "codebase. Use read_file to see a file's contents, list_directory to see " +
  "what's in a directory (defaults to the current directory), and " +
  "search_files to grep a regex pattern across files in a directory tree. " +
  "Use write_file to create or overwrite a file with new content. Prefer " +
  "read_file, list_directory, or search_files to gather context before " +
  "answering; only use write_file when the user has actually asked for a " +
  "file to be created or changed.";

/** Drives the agentic loop: ask the model, run any tools it calls, repeat until it answers in text. */
export async function runAgent(client: Anthropic, question: string): Promise<string> {
  const messages: MessageParam[] = [{ role: "user", content: question }];

  while (true) {
    const response = await askModel(client, messages);
    messages.push({ role: "assistant", content: response.content });

    const toolCalls = response.content.filter(isToolUseBlock);
    if (toolCalls.length === 0) {
      return extractText(response.content);
    }

    const toolResults = toolCalls.map(runToolCall);
    messages.push({ role: "user", content: toolResults });
  }
}

/**
 * Sends the current conversation history to the model, along with the system
 * prompt and the list of available tools, and returns the model's response
 * (which may contain text and/or tool_use blocks for the agent loop to handle).
 */
function askModel(client: Anthropic, messages: MessageParam[]) {
  return client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
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
function runToolCall(toolCall: ToolUseBlock): ToolResultBlockParam {
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

function logToolCall(name: string, input: Record<string, unknown>): void {
  console.log(`→ ${name}(${JSON.stringify(input)})`);
}

function logToolSuccess(name: string): void {
  console.log(`✓ ${name}`);
}

function logToolError(name: string, message: string): void {
  console.error(`✗ ${name}: ${message}`);
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
