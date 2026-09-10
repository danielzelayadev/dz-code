import { describe, expect, it } from "vitest";
import fs from "fs";
import { execSync } from "child_process";
import { editFile, editFileConfirmation } from "../../src/tools/edit-file";
import { useTempCwd } from "../helpers/fs-fixture";

describe("editFile", () => {
  useTempCwd();

  it("replaces the single occurrence of old_string with new_string", () => {
    fs.writeFileSync("file.txt", "before\nhello\nafter", "utf-8");

    const result = editFile("file.txt", "hello", "goodbye");

    expect(fs.readFileSync("file.txt", "utf-8")).toBe("before\ngoodbye\nafter");
    expect(result).toContain("file.txt");
  });

  it("throws when old_string doesn't appear in the file", () => {
    fs.writeFileSync("file.txt", "before\nafter", "utf-8");

    expect(() => editFile("file.txt", "missing", "x")).toThrow(/not found/);
  });

  it("throws when old_string appears more than once", () => {
    fs.writeFileSync("file.txt", "dup\ndup", "utf-8");

    expect(() => editFile("file.txt", "dup", "x")).toThrow(/appears 2 times/);
  });
});

describe("editFileConfirmation", () => {
  useTempCwd();

  it("describes the path and both strings", () => {
    const message = editFileConfirmation.describe({
      path: "file.txt",
      old_string: "old",
      new_string: "new",
    });

    expect(message).toContain("file.txt");
    expect(message).toContain("old");
    expect(message).toContain("new");
  });

  it("requires confirmation when the directory isn't a git repo", () => {
    expect(editFileConfirmation.isRequired({ path: "file.txt" })).toBe(true);
  });

  it("skips confirmation for a file git would track", () => {
    execSync("git init -q");
    fs.writeFileSync("file.txt", "content", "utf-8");

    expect(editFileConfirmation.isRequired({ path: "file.txt" })).toBe(false);
  });
});
