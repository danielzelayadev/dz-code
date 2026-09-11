import { describe, expect, it } from "vitest";
import fs from "fs";
import { execSync } from "child_process";
import { writeFile, writeFileConfirmation } from "../../src/tools/write-file";
import { useTempCwd } from "../helpers/fs-fixture";

describe("writeFile", () => {
  useTempCwd();

  it("creates a new file with the given content", () => {
    const result = writeFile("new.txt", "hello");

    expect(fs.readFileSync("new.txt", "utf-8")).toBe("hello");
    expect(result).toBe("Wrote 5 characters to new.txt.");
  });

  it("overwrites an existing file rather than appending", () => {
    fs.writeFileSync("existing.txt", "old content", "utf-8");

    writeFile("existing.txt", "new");

    expect(fs.readFileSync("existing.txt", "utf-8")).toBe("new");
  });

  it("throws when the parent directory doesn't exist", () => {
    expect(() => writeFile("missing-dir/file.txt", "content")).toThrow(/ENOENT/);
  });
});

describe("writeFileConfirmation", () => {
  useTempCwd();

  it("describes the content", () => {
    const message = writeFileConfirmation.describe({ path: "file.txt", content: "hello" });

    expect(message).toContain("hello");
  });

  it("summarizes the action with the path", () => {
    const summary = writeFileConfirmation.summarize({ path: "file.txt", content: "hello" });

    expect(summary).toContain("file.txt");
  });

  it("requires confirmation when the directory isn't a git repo", () => {
    expect(writeFileConfirmation.isRequired({ path: "file.txt" })).toBe(true);
  });

  it("skips confirmation for a file git would track", () => {
    execSync("git init -q");
    fs.writeFileSync("file.txt", "content", "utf-8");

    expect(writeFileConfirmation.isRequired({ path: "file.txt" })).toBe(false);
  });
});
