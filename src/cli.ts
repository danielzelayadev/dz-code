/** Reads and validates input from the outside world: env vars and CLI flags. */
import { red } from "./colors";

/** Reads the API key from the environment, or exits with a helpful error. */
export function requireApiKey(): string {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error(red("Error: ANTHROPIC_API_KEY environment variable is not set."));
    process.exit(1);
  }
  return apiKey;
}

/** Reads the user's question from argv, or exits with usage instructions. */
export function requireQuestion(): string {
  const question = process.argv[2];
  if (!question) {
    console.error(
      red(
        'Usage: npm start -- "your question about the codebase"\n' +
          "   or: npm start -- --clear-history [--clear-notes]  (clear saved memory)",
      ),
    );
    process.exit(1);
  }
  return question;
}

export interface ClearFlags {
  history: boolean;
  notes: boolean;
}

/** Reads which --clear-* flags were passed on argv. */
export function parseClearFlags(): ClearFlags {
  const args = process.argv.slice(2);
  return {
    history: args.includes("--clear-history"),
    notes: args.includes("--clear-notes"),
  };
}
