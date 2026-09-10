import fs from "fs";
import type { Tool } from "@anthropic-ai/sdk/resources/messages";
import { MAX_NOTES_LENGTH, NOTES_FILE } from "../notes";

/** Tool schema handed to the model. */
export const UPDATE_NOTES_TOOL: Tool = {
  name: "update_notes",
  description:
    "Replace the project's long-term notes file (PROJECT_NOTES.md) with a " +
    "complete, revised version. This is a full rewrite, not an append or a " +
    "diff: submit the entire file you want saved, including whatever from " +
    "the current notes (shown to you above under '## Project notes') is " +
    "still worth keeping. Before calling this, actively prune stale or " +
    "superseded entries, merge anything duplicated, and fold in new facts " +
    "learned this turn — the goal is a clean, current document, not a " +
    "growing log. Use it for durable facts worth remembering across " +
    "sessions — architecture, conventions, past mistakes — not for routine " +
    `narration of what you just did or one-off task status. The file is ` +
    `capped at ${MAX_NOTES_LENGTH} characters; if your revision would ` +
    "exceed that, cut lower-value content rather than trying to keep " +
    "everything.",
  input_schema: {
    type: "object",
    properties: {
      notes: {
        type: "string",
        description:
          "The complete, revised content of PROJECT_NOTES.md — the full " +
          `file, not a diff or a single new note. Must be ` +
          `${MAX_NOTES_LENGTH} characters or fewer.`,
      },
    },
    required: ["notes"],
  },
};

/** Overwrites PROJECT_NOTES.md with a full, model-revised copy of the notes. */
export function updateNotes(notes: string): string {
  if (notes.length > MAX_NOTES_LENGTH) {
    throw new Error(
      `Notes are ${notes.length} characters, which exceeds the ` +
        `${MAX_NOTES_LENGTH} character limit. Trim it down and try again.`,
    );
  }

  const content = notes.endsWith("\n") ? notes : `${notes}\n`;
  fs.writeFileSync(NOTES_FILE, content, "utf-8");
  return `Rewrote ${NOTES_FILE} (${content.length} characters).`;
}
