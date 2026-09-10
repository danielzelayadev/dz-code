/** Reads the API key from the environment, or exits with a helpful error. */
export function requireApiKey(): string {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("Error: ANTHROPIC_API_KEY environment variable is not set.");
    process.exit(1);
  }
  return apiKey;
}

/** Reads the user's question from argv, or exits with usage instructions. */
export function requireQuestion(): string {
  const question = process.argv[2];
  if (!question) {
    console.error('Usage: npm start -- "your question about the codebase"');
    process.exit(1);
  }
  return question;
}
