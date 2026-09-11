/** Asks the terminal user to approve an action before it runs. */
import * as readline from "readline/promises";

export type ConfirmFn = (message: string) => Promise<boolean>;

const APP_NAME = "DZ Code";

/** Combines a short action summary and its technical details into the message shown before the y/N prompt. */
export function buildConfirmationMessage(summary: string, details: string): string {
  return `${APP_NAME} is asking permission to ${summary}. Details:\n\n${details}`;
}

/** Prints `message` and asks the user to type 'y' to proceed, defaulting to no. */
export async function confirmAction(
  message: string,
  input: NodeJS.ReadableStream = process.stdin,
  output: NodeJS.WritableStream = process.stdout,
): Promise<boolean> {
  const rl = readline.createInterface({ input, output });
  try {
    const answer = await rl.question(`${message}\n\nType 'y' to proceed: `);
    return answer.trim().toLowerCase() === "y";
  } finally {
    rl.close();
  }
}
