/** Tool: lists the contents of a directory. */
import fs from "fs";
import type { Tool } from "@anthropic-ai/sdk/resources/messages";

/** Tool schema handed to the model. */
export const LIST_DIRECTORY_TOOL: Tool = {
  name: "list_directory",
  description:
    "List the files and subdirectories directly inside a directory. " +
    "Defaults to the current directory when no path is given. Directory " +
    "names are shown with a trailing '/'.",
  input_schema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description:
          "Directory to list, relative or absolute. Defaults to the current directory.",
      },
    },
    required: [],
  },
};

/** Lists a directory's immediate entries, directories marked with a trailing '/'. */
export function listDirectory(path: string = "."): string {
  const entries = fs.readdirSync(path, { withFileTypes: true });
  if (entries.length === 0) return "(empty directory)";

  return entries
    .map((entry) => (entry.isDirectory() ? `${entry.name}/` : entry.name))
    .sort()
    .join("\n");
}
