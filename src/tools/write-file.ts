/** Tool: creates or overwrites a file with new content. */
import fs from "fs";
import type { Tool } from "@anthropic-ai/sdk/resources/messages";
import { isGitRecoverable } from "../git";
import type { ToolConfirmation } from "./tool-definition";

/** Tool schema handed to the model. */
export const WRITE_FILE_TOOL: Tool = {
  name: "write_file",
  description:
    "Write content to a file at the given path, creating the file if it " +
    "doesn't exist or overwriting it if it does. The parent directory must " +
    "already exist.",
  input_schema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Path to the file to write, relative or absolute.",
      },
      content: {
        type: "string",
        description: "Content to write to the file.",
      },
    },
    required: ["path", "content"],
  },
};

/** Writes content to a file, creating it if missing or overwriting it if present. */
export function writeFile(path: string, content: string): string {
  fs.writeFileSync(path, content, "utf-8");
  return `Wrote ${content.length} characters to ${path}.`;
}

/** Requires confirmation unless git would let the user recover the file's prior contents. */
export const writeFileConfirmation: ToolConfirmation = {
  isRequired: (input) => !isGitRecoverable(input.path as string),
  summarize: (input) => `write to ${input.path}`,
  describe: (input) => `${input.content}`,
};
