import type {
  ImageBlockParam,
  MessageParam,
  TextBlockParam,
  Tool,
  ToolResultBlockParam,
  ToolUseBlockParam,
} from "@anthropic-ai/sdk/resources/messages";
import { loadSessionHistory } from "../session";

const MAX_MATCHES = 20;
const MAX_ENTRY_LENGTH = 500;

type MessageContentBlock = TextBlockParam | ImageBlockParam | ToolUseBlockParam | ToolResultBlockParam;

/** Tool schema handed to the model. */
export const CHECK_HISTORY_TOOL: Tool = {
  name: "check_history",
  description:
    "Search past conversation history from earlier sessions of this CLI " +
    "(saved to .session.json) for a regular expression pattern (JS regex " +
    "syntax). Use this when something feels like it was already discussed " +
    "or decided in an earlier session but isn't in your current context. " +
    "Returns matching turns as '[#N role]: text', capped at 20 matches, " +
    "each truncated to 500 characters.",
  input_schema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Regular expression to search past turns for (JS regex syntax).",
      },
    },
    required: ["query"],
  },
};

/** Searches saved session history for turns matching a regex, formatted as '[#N role]: text'. */
export function checkHistory(query: string): string {
  const history = loadSessionHistory();
  if (history.length === 0) return "No past session history found.";

  const regex = new RegExp(query);
  const matches = flattenHistory(history)
    .filter((entry) => regex.test(entry.text))
    .map(formatEntry);

  if (matches.length === 0) return `No history matching /${query}/.`;

  const shown = matches.slice(0, MAX_MATCHES);
  const omitted = matches.length - shown.length;
  if (omitted === 0) return shown.join("\n");
  return `${shown.join("\n")}\n... (truncated, ${omitted} more match${omitted === 1 ? "" : "es"})`;
}

interface HistoryEntry {
  index: number;
  role: string;
  text: string;
}

/** Flattens saved messages into one searchable text entry per message. */
function flattenHistory(history: MessageParam[]): HistoryEntry[] {
  return history.map((message, index) => ({
    index,
    role: message.role,
    text: formatContent(message.content),
  }));
}

/** Collapses a message's content (string or content blocks) into one readable string. */
function formatContent(content: string | MessageContentBlock[] | undefined): string {
  if (content === undefined) return "";
  if (typeof content === "string") return content;
  return content.map(formatBlock).join(" ");
}

/** Renders a single content block as a short readable summary. */
function formatBlock(block: MessageContentBlock): string {
  switch (block.type) {
    case "text":
      return block.text;
    case "tool_use":
      return `[called ${block.name}(${JSON.stringify(block.input)})]`;
    case "tool_result":
      return `[tool result: ${formatContent(block.content)}]`;
    default:
      return `[${block.type}]`;
  }
}

/** Formats a history entry for display, truncating overly long text. */
function formatEntry(entry: HistoryEntry): string {
  const text =
    entry.text.length > MAX_ENTRY_LENGTH
      ? `${entry.text.slice(0, MAX_ENTRY_LENGTH)}...`
      : entry.text;
  return `[#${entry.index} ${entry.role}]: ${text}`;
}
