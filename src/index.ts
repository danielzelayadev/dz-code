import Anthropic from "@anthropic-ai/sdk";
import { requireApiKey, requireQuestion, parseClearFlags, ClearFlags } from "./cli";
import { runAgent, buildSystemPrompt } from "./agent";
import { addToSessionHistory, clearSessionHistory } from "./session";
import { loadProjectNotes, clearProjectNotes } from "./notes";

async function main() {
  const clearFlags = parseClearFlags();
  if (clearFlags.history || clearFlags.notes) {
    return runClear(clearFlags);
  }

  const apiKey = requireApiKey();
  const question = requireQuestion();

  const client = new Anthropic({ apiKey });
  const systemPrompt = buildSystemPrompt(loadProjectNotes());

  const { answer, messages } = await runAgent(client, question, systemPrompt);

  console.log(answer);
  addToSessionHistory(messages);
}

/** Clears whichever persistent memory files were requested via CLI flags. */
function runClear(flags: ClearFlags): void {
  if (flags.history) {
    console.log(
      clearSessionHistory()
        ? "Cleared session history (.session.json)."
        : "No session history to clear.",
    );
  }
  if (flags.notes) {
    console.log(
      clearProjectNotes()
        ? "Cleared project notes (PROJECT_NOTES.md)."
        : "No project notes to clear.",
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
