import Anthropic from "@anthropic-ai/sdk";
import { requireApiKey, requireQuestion } from "./cli";
import { runAgent, buildSystemPrompt } from "./agent";
import { loadSessionHistory, saveSessionHistory } from "./session";
import { loadProjectNotes } from "./notes";

async function main() {
  const apiKey = requireApiKey();
  const question = requireQuestion();

  const client = new Anthropic({ apiKey });
  const history = loadSessionHistory();
  const systemPrompt = buildSystemPrompt(loadProjectNotes());

  const { answer, messages } = await runAgent(client, history, question, systemPrompt);

  console.log(answer);
  saveSessionHistory(messages);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
