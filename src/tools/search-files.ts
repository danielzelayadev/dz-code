import fs from "fs";
import path from "path";
import type { Tool } from "@anthropic-ai/sdk/resources/messages";

const SKIP_DIRS = new Set(["node_modules", ".git", "dist"]);
const MAX_MATCHES = 200;

/** Tool schema handed to the model. */
export const SEARCH_FILES_TOOL: Tool = {
  name: "search_files",
  description:
    "Recursively search files under a directory for lines matching a " +
    "regular expression pattern (JS regex syntax). Returns matches as " +
    "'path:line: text', one per line, skipping node_modules, .git, and " +
    "dist. Output is capped at 200 matches.",
  input_schema: {
    type: "object",
    properties: {
      pattern: {
        type: "string",
        description: "Regular expression to search for (JS regex syntax).",
      },
      directory: {
        type: "string",
        description:
          "Directory to search recursively. Defaults to the current directory.",
      },
    },
    required: ["pattern"],
  },
};

/** Greps a directory tree for lines matching a regex, formatted as 'path:line: text'. */
export function searchFiles(pattern: string, directory: string = "."): string {
  const regex = new RegExp(pattern);
  const matches: string[] = [];
  collectMatches(directory, regex, matches);

  if (matches.length === 0) return "No matches found.";

  const shown = matches.slice(0, MAX_MATCHES);
  const omitted = matches.length - shown.length;
  if (omitted === 0) return shown.join("\n");
  return `${shown.join("\n")}\n... (truncated, ${omitted} more match${omitted === 1 ? "" : "es"})`;
}

/** Recursively walks a directory, appending regex matches from each file it finds. */
function collectMatches(directory: string, regex: RegExp, matches: string[]): void {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) collectMatches(fullPath, regex, matches);
    } else if (entry.isFile()) {
      matches.push(...matchesInFile(fullPath, regex));
    }
  }
}

/** Returns each line in a file that matches the regex, formatted as 'path:line: text'. */
function matchesInFile(filePath: string, regex: RegExp): string[] {
  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    return []; // unreadable file (permissions, etc.) — skip it
  }

  return content
    .split("\n")
    .map((line, i) => ({ line, number: i + 1 }))
    .filter(({ line }) => regex.test(line))
    .map(({ line, number }) => `${filePath}:${number}: ${line}`);
}
