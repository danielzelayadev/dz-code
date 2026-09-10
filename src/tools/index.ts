/**
 * Registry mapping each tool's name to its schema and handler, so agent.ts
 * can dispatch by name.
 */
import type { Tool } from "@anthropic-ai/sdk/resources/messages";
import { READ_FILE_TOOL, readFile } from "./read-file";
import { LIST_DIRECTORY_TOOL, listDirectory } from "./list-directory";
import { SEARCH_FILES_TOOL, searchFiles } from "./search-files";
import { WRITE_FILE_TOOL, writeFile, writeFileConfirmation } from "./write-file";
import { EDIT_FILE_TOOL, editFile, editFileConfirmation } from "./edit-file";
import { RUN_BASH_TOOL, runBash, runBashConfirmation } from "./run-bash";
import { UPDATE_NOTES_TOOL, updateNotes } from "./update-notes";
import { CHECK_HISTORY_TOOL, checkHistory } from "./check-history";
import type { ToolDefinition } from "./tool-definition";

export type { ToolDefinition, ToolConfirmation } from "./tool-definition";

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
    confirmation: writeFileConfirmation,
  },
  edit_file: {
    tool: EDIT_FILE_TOOL,
    handler: (input) =>
      editFile(input.path as string, input.old_string as string, input.new_string as string),
    confirmation: editFileConfirmation,
  },
  run_bash: {
    tool: RUN_BASH_TOOL,
    handler: (input) => runBash(input.command as string),
    confirmation: runBashConfirmation,
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
