import { execSync } from "child_process";
import fs from "fs";
import { describe, expect, it } from "vitest";
import { isGitRecoverable } from "../src/git";
import { useTempCwd } from "./helpers/fs-fixture";

describe("isGitRecoverable", () => {
  useTempCwd();

  it("returns false when the directory isn't a git repo at all", () => {
    fs.writeFileSync("foo.txt", "hello", "utf-8");

    expect(isGitRecoverable("foo.txt")).toBe(false);
  });

  it("returns true for a file git would track (not gitignored)", () => {
    execSync("git init -q");
    fs.writeFileSync("foo.txt", "hello", "utf-8");

    expect(isGitRecoverable("foo.txt")).toBe(true);
  });

  it("returns false for a gitignored file", () => {
    execSync("git init -q");
    fs.writeFileSync(".gitignore", "ignored.txt\n", "utf-8");
    fs.writeFileSync("ignored.txt", "secret", "utf-8");

    expect(isGitRecoverable("ignored.txt")).toBe(false);
  });
});
