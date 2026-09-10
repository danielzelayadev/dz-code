/** Asks the terminal user to approve an action before it runs. */
import * as readline from "readline/promises";

export type ConfirmFn = (message: string) => Promise<boolean>;

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
