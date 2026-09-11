/** Shared shapes for a registered tool: its schema, handler, and optional confirmation gate. */
import type { Tool } from "@anthropic-ai/sdk/resources/messages";

/** Governs whether a tool call must be approved by the user before it runs. */
export interface ToolConfirmation {
  /** Whether this particular call needs approval. */
  isRequired: (input: Record<string, unknown>) => boolean;
  /** Short human phrase for what's being approved, e.g. "edit file.txt". */
  summarize: (input: Record<string, unknown>) => string;
  /** The technical detail shown under "Details:" — the exact command, or path plus old/new content. */
  describe: (input: Record<string, unknown>) => string;
}

export interface ToolDefinition {
  tool: Tool;
  handler: (input: Record<string, unknown>) => string;
  /** Absent means this tool never requires confirmation. */
  confirmation?: ToolConfirmation;
}
