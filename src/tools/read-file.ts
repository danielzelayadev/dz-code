/** Tool: reads a file's contents. */
import fs from "fs";
import type { Tool } from "@anthropic-ai/sdk/resources/messages";

const MAX_LINES = 300;

/** Tool schema handed to the model. */
export const READ_FILE_TOOL: Tool = {
  name: "read_file",
  description:
    "Read a file from the local filesystem and return its contents with " +
    "1-based line numbers. If the file is longer than ~300 lines, the " +
    "output is truncated and a note is appended saying how many lines " +
    "were omitted.",
  input_schema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Path to the file to read, relative or absolute.",
      },
    },
    required: ["path"],
  },
};

/** Reads a file and formats it as line-numbered text, truncated to MAX_LINES. */
export function readFile(path: string): string {
  const lines = fs.readFileSync(path, "utf-8").split("\n");
  const shown = lines.slice(0, MAX_LINES);
  const numbered = shown
    .map((line, i) => `${String(i + 1).padStart(4, " ")}\t${line}`)
    .join("\n");

  const omitted = lines.length - shown.length;
  if (omitted === 0) return numbered;
  return `${numbered}\n... (truncated, ${omitted} more line${omitted === 1 ? "" : "s"})`;
}
