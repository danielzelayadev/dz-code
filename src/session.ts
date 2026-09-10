import fs from "fs";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";

const SESSION_FILE = ".session.json";

/** Loads the saved conversation history, or an empty history if none exists yet. */
export function loadSessionHistory(): MessageParam[] {
  if (!fs.existsSync(SESSION_FILE)) return [];

  try {
    return JSON.parse(fs.readFileSync(SESSION_FILE, "utf-8"));
  } catch (err) {
    console.error(`Warning: couldn't read ${SESSION_FILE}, starting a fresh session (${err})`);
    return [];
  }
}

/** Saves the full conversation history so the next run can pick up where this one left off. */
export function saveSessionHistory(messages: MessageParam[]): void {
  fs.writeFileSync(SESSION_FILE, JSON.stringify(messages, null, 2), "utf-8");
}
