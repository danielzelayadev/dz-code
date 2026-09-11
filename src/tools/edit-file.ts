/** Tool: replaces one exact snippet of text in an existing file. */
import fs from "fs";
import type { Tool } from "@anthropic-ai/sdk/resources/messages";
import { isGitRecoverable } from "../git";
import type { ToolConfirmation } from "./tool-definition";

/** Tool schema handed to the model. */
export const EDIT_FILE_TOOL: Tool = {
  name: "edit_file",
  description:
    "Replace an exact snippet of text in an existing file with new text. " +
    "Fails if old_string doesn't appear in the file, or appears more than " +
    "once — old_string must uniquely identify the text to replace.",
  input_schema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Path to the file to edit, relative or absolute.",
      },
      old_string: {
        type: "string",
        description: "The exact text to find. Must appear exactly once in the file.",
      },
      new_string: {
        type: "string",
        description: "The text to replace old_string with.",
      },
    },
    required: ["path", "old_string", "new_string"],
  },
};

/** Replaces the single occurrence of oldString in the file with newString. */
export function editFile(path: string, oldString: string, newString: string): string {
  const content = fs.readFileSync(path, "utf-8");
  const occurrences = countOccurrences(content, oldString);

  if (occurrences === 0) {
    throw new Error(`old_string not found in ${path}.`);
  }
  if (occurrences > 1) {
    throw new Error(`old_string appears ${occurrences} times in ${path}; it must be unique.`);
  }

  fs.writeFileSync(path, content.replace(oldString, newString), "utf-8");
  return `Replaced 1 occurrence of old_string in ${path}.`;
}

function countOccurrences(content: string, target: string): number {
  return content.split(target).length - 1;
}

/** Requires confirmation unless git would let the user recover the file's prior contents. */
export const editFileConfirmation: ToolConfirmation = {
  isRequired: (input) => !isGitRecoverable(input.path as string),
  summarize: (input) => `edit ${input.path}`,
  describe: (input) => `- ${input.old_string}\n+ ${input.new_string}`,
};
