import Anthropic from "@anthropic-ai/sdk";
import { requireApiKey, requireQuestion } from "./cli";
import { runAgent } from "./agent";

async function main() {
  const apiKey = requireApiKey();
  const question = requireQuestion();

  const client = new Anthropic({ apiKey });
  const answer = await runAgent(client, question);

  console.log(answer);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
