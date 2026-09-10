import fs from "fs";

export const NOTES_FILE = "PROJECT_NOTES.md";

/** Loads the project notes file, or null if the agent hasn't written one yet. */
export function loadProjectNotes(): string | null {
  if (!fs.existsSync(NOTES_FILE)) return null;
  return fs.readFileSync(NOTES_FILE, "utf-8");
}
