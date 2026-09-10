import { describe, expect, it } from "vitest";
import fs from "fs";
import { updateNotes } from "../../src/tools/update-notes";
import { MAX_NOTES_LENGTH, NOTES_FILE } from "../../src/notes";
import { useTempCwd } from "../helpers/fs-fixture";

describe("updateNotes", () => {
  useTempCwd();

  it("writes the notes, adding a trailing newline if missing", () => {
    const result = updateNotes("some notes");

    expect(fs.readFileSync(NOTES_FILE, "utf-8")).toBe("some notes\n");
    expect(result).toBe(`Rewrote ${NOTES_FILE} (11 characters).`);
  });

  it("doesn't add a second trailing newline when one is already present", () => {
    updateNotes("some notes\n");

    expect(fs.readFileSync(NOTES_FILE, "utf-8")).toBe("some notes\n");
  });

  it("overwrites the previous notes rather than appending", () => {
    updateNotes("first version");

    updateNotes("second version");

    expect(fs.readFileSync(NOTES_FILE, "utf-8")).toBe("second version\n");
  });

  it("throws and leaves no file behind when notes exceed the length limit", () => {
    const tooLong = "x".repeat(MAX_NOTES_LENGTH + 1);

    expect(() => updateNotes(tooLong)).toThrow(
      `Notes are ${tooLong.length} characters, which exceeds the ${MAX_NOTES_LENGTH} character limit. Trim it down and try again.`,
    );
    expect(fs.existsSync(NOTES_FILE)).toBe(false);
  });
});
