/** Tool: executes a shell command and returns its stdout/stderr/exit code. */
import { spawnSync } from "child_process";
import type { Tool } from "@anthropic-ai/sdk/resources/messages";
import type { ToolConfirmation } from "./tool-definition";

const MAX_OUTPUT_LENGTH = 10000;

/** Tool schema handed to the model. */
export const RUN_BASH_TOOL: Tool = {
  name: "run_bash",
  description:
    "Execute a shell command and return its stdout, stderr, and exit code. " +
    "Use for things the other tools can't do, like running tests or a " +
    "build. The user must approve every command before it runs.",
  input_schema: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "The shell command to execute.",
      },
    },
    required: ["command"],
  },
};

/** Runs a shell command, returning its output. A nonzero exit is reported, not thrown. */
export function runBash(command: string): string {
  const result = spawnSync(command, { shell: true, encoding: "utf-8" });
  if (result.error) {
    throw result.error;
  }

  return truncate(formatResult(result.stdout, result.stderr, result.status));
}

function formatResult(stdout: string, stderr: string, status: number | null): string {
  const parts: string[] = [];
  if (stdout) parts.push(`stdout:\n${stdout}`);
  if (stderr) parts.push(`stderr:\n${stderr}`);
  parts.push(`exit code: ${status}`);
  return parts.join("\n\n");
}

function truncate(output: string): string {
  if (output.length <= MAX_OUTPUT_LENGTH) return output;
  const omitted = output.length - MAX_OUTPUT_LENGTH;
  return `${output.slice(0, MAX_OUTPUT_LENGTH)}\n... (truncated, ${omitted} more characters)`;
}

/** Always requires confirmation — running arbitrary commands is the highest-risk tool. */
export const runBashConfirmation: ToolConfirmation = {
  isRequired: () => true,
  summarize: () => "run a shell command",
  describe: (input) => `${input.command}`,
};
