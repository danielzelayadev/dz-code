import fs from "fs";
import type { Tool } from "@anthropic-ai/sdk/resources/messages";
import { NOTES_FILE } from "../notes";

/** Tool schema handed to the model. */
export const UPDATE_NOTES_TOOL: Tool = {
  name: "update_notes",
  description:
    "Append a note to the project's long-term notes file (PROJECT_NOTES.md). " +
    "Use this for facts worth remembering across sessions — architecture, " +
    "conventions, or past mistakes — not for routine narration of what you " +
    "just did. Notes are appended, not replaced.",
  input_schema: {
    type: "object",
    properties: {
      note: {
        type: "string",
        description: "The note to record.",
      },
    },
    required: ["note"],
  },
};

/** Appends a note to PROJECT_NOTES.md, creating it with a header if it doesn't exist yet. */
export function updateNotes(note: string): string {
  if (!fs.existsSync(NOTES_FILE)) {
    fs.writeFileSync(NOTES_FILE, "# Project Notes\n", "utf-8");
  }

  fs.appendFileSync(NOTES_FILE, `\n${note}\n`, "utf-8");
  return `Added note to ${NOTES_FILE}.`;
}
