/** Shared shapes for a registered tool: its schema, handler, and optional confirmation gate. */
import type { Tool } from "@anthropic-ai/sdk/resources/messages";

/** Governs whether a tool call must be approved by the user before it runs. */
export interface ToolConfirmation {
  /** Whether this particular call needs approval. */
  isRequired: (input: Record<string, unknown>) => boolean;
  /** The action description printed to the user before the y/N prompt. */
  describe: (input: Record<string, unknown>) => string;
}

export interface ToolDefinition {
  tool: Tool;
  handler: (input: Record<string, unknown>) => string;
  /** Absent means this tool never requires confirmation. */
  confirmation?: ToolConfirmation;
}
