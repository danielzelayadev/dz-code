import fs from "fs";

export const NOTES_FILE = "PROJECT_NOTES.md";
export const MAX_NOTES_LENGTH = 4000;

/** Loads the project notes file, or null if the agent hasn't written one yet. */
export function loadProjectNotes(): string | null {
  if (!fs.existsSync(NOTES_FILE)) return null;
  return fs.readFileSync(NOTES_FILE, "utf-8");
}

/** Deletes the project notes file, if one exists. Returns whether anything was cleared. */
export function clearProjectNotes(): boolean {
  if (!fs.existsSync(NOTES_FILE)) return false;
  fs.unlinkSync(NOTES_FILE);
  return true;
}
