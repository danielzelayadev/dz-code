import type Anthropic from "@anthropic-ai/sdk";
import type { Message, ContentBlock } from "@anthropic-ai/sdk/resources/messages";
import { vi } from "vitest";

/**
 * A fake Anthropic client whose messages.create() resolves through the
 * given responses in order, one per call. runAgent() only ever touches
 * client.messages.create, so nothing else needs faking.
 */
export function createFakeClient(...responses: Message[]): Anthropic {
  const create = vi.fn();
  responses.forEach((response) => create.mockResolvedValueOnce(response));
  return { messages: { create } } as unknown as Anthropic;
}

/** Builds a text-only assistant response, as if the model gave its final answer. */
export function textResponse(text: string): Message {
  return buildMessage([{ type: "text", text }], "end_turn");
}

/** Builds an assistant response requesting a single tool call. */
export function toolUseResponse(
  name: string,
  input: Record<string, unknown>,
  id = `toolu_${name}`,
): Message {
  return parallelToolUseResponse([{ name, input, id }]);
}

interface ToolCallSpec {
  name: string;
  input: Record<string, unknown>;
  id?: string;
}

/** Builds an assistant response requesting several tool calls in one turn. */
export function parallelToolUseResponse(calls: ToolCallSpec[]): Message {
  const blocks = calls.map(
    ({ name, input, id = `toolu_${name}` }): ContentBlock => ({
      type: "tool_use",
      id,
      name,
      input,
    }),
  );
  return buildMessage(blocks, "tool_use");
}

function buildMessage(content: ContentBlock[], stopReason: Message["stop_reason"]): Message {
  return {
    id: "msg_fake",
    content,
    model: "claude-sonnet-5",
    role: "assistant",
    stop_reason: stopReason,
    stop_sequence: null,
    type: "message",
    usage: {
      input_tokens: 0,
      output_tokens: 0,
    },
  };
}
