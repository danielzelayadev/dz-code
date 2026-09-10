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

/** Appends new messages to the saved history and persists the result. */
export function addToSessionHistory(newMessages: MessageParam[]): void {
  const history = loadSessionHistory();
  saveSessionHistory([...history, ...newMessages]);
}

/** Overwrites the saved history file with the given messages. */
function saveSessionHistory(messages: MessageParam[]): void {
  fs.writeFileSync(SESSION_FILE, JSON.stringify(messages, null, 2), "utf-8");
}

/** Deletes the saved session history file, if one exists. Returns whether anything was cleared. */
export function clearSessionHistory(): boolean {
  if (!fs.existsSync(SESSION_FILE)) return false;
  fs.unlinkSync(SESSION_FILE);
  return true;
}
