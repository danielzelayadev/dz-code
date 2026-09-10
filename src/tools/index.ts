/**
 * Registry mapping each tool's name to its schema and handler, so agent.ts
 * can dispatch by name.
 */
import type { Tool } from "@anthropic-ai/sdk/resources/messages";
import { READ_FILE_TOOL, readFile } from "./read-file";
import { LIST_DIRECTORY_TOOL, listDirectory } from "./list-directory";
import { SEARCH_FILES_TOOL, searchFiles } from "./search-files";
import { WRITE_FILE_TOOL, writeFile } from "./write-file";
import { UPDATE_NOTES_TOOL, updateNotes } from "./update-notes";
import { CHECK_HISTORY_TOOL, checkHistory } from "./check-history";

export interface ToolDefinition {
  tool: Tool;
  handler: (input: Record<string, unknown>) => string;
}

/** Registry of every tool available to the agent, keyed by the name the model calls. */
export const TOOLS: Record<string, ToolDefinition> = {
  read_file: {
    tool: READ_FILE_TOOL,
    handler: (input) => readFile(input.path as string),
  },
  list_directory: {
    tool: LIST_DIRECTORY_TOOL,
    handler: (input) => listDirectory((input.path as string) ?? "."),
  },
  search_files: {
    tool: SEARCH_FILES_TOOL,
    handler: (input) =>
      searchFiles(input.pattern as string, (input.directory as string) ?? "."),
  },
  write_file: {
    tool: WRITE_FILE_TOOL,
    handler: (input) => writeFile(input.path as string, input.content as string),
  },
  update_notes: {
    tool: UPDATE_NOTES_TOOL,
    handler: (input) => updateNotes(input.notes as string),
  },
  check_history: {
    tool: CHECK_HISTORY_TOOL,
    handler: (input) => checkHistory(input.query as string),
  },
};

export const TOOL_LIST: Tool[] = Object.values(TOOLS).map((def) => def.tool);
