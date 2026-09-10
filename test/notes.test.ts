import { describe, expect, it } from "vitest";
import { clearProjectNotes, loadProjectNotes, NOTES_FILE } from "../src/notes";
import { useTempCwd } from "./helpers/fs-fixture";
import fs from "fs";

describe("loadProjectNotes", () => {
  useTempCwd();

  it("returns null when the notes file doesn't exist", () => {
    expect(loadProjectNotes()).toBeNull();
  });

  it("returns the file's contents when it exists", () => {
    fs.writeFileSync(NOTES_FILE, "some project notes", "utf-8");

    expect(loadProjectNotes()).toBe("some project notes");
  });
});

describe("clearProjectNotes", () => {
  useTempCwd();

  it("deletes the file and returns true when one exists", () => {
    fs.writeFileSync(NOTES_FILE, "some notes", "utf-8");

    expect(clearProjectNotes()).toBe(true);
    expect(fs.existsSync(NOTES_FILE)).toBe(false);
  });

  it("returns false when there's nothing to clear", () => {
    expect(clearProjectNotes()).toBe(false);
  });
});
