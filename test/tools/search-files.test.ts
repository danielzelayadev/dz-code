import { describe, expect, it } from "vitest";
import fs from "fs";
import { searchFiles } from "../../src/tools/search-files";
import { useTempCwd } from "../helpers/fs-fixture";

describe("searchFiles", () => {
  useTempCwd();

  it("finds matches across nested files, formatted as path:line: text", () => {
    fs.mkdirSync("nested");
    fs.writeFileSync("top.txt", "no match here\nfindme once", "utf-8");
    fs.writeFileSync("nested/deep.txt", "findme twice", "utf-8");

    const result = searchFiles("findme");

    expect(result.split("\n").sort()).toEqual([
      "nested/deep.txt:1: findme twice",
      "top.txt:2: findme once",
    ]);
  });

  it("skips node_modules, .git, and dist even when they contain matches", () => {
    for (const dir of ["node_modules", ".git", "dist"]) {
      fs.mkdirSync(dir);
      fs.writeFileSync(`${dir}/file.txt`, "findme", "utf-8");
    }
    fs.writeFileSync("real.txt", "findme", "utf-8");

    expect(searchFiles("findme")).toBe("real.txt:1: findme");
  });

  it("returns a message when nothing matches", () => {
    fs.writeFileSync("file.txt", "nothing relevant", "utf-8");

    expect(searchFiles("findme")).toBe("No matches found.");
  });

  it("caps output at 200 matches and notes how many were omitted", () => {
    fs.writeFileSync("many.txt", Array(205).fill("findme").join("\n"), "utf-8");

    const result = searchFiles("findme");

    expect(result.split("\n")).toHaveLength(201); // 200 matches + the note
    expect(result).toContain("... (truncated, 5 more matches)");
  });

  it("uses the singular form when exactly one match is omitted", () => {
    fs.writeFileSync("many.txt", Array(201).fill("findme").join("\n"), "utf-8");

    expect(searchFiles("findme")).toContain("... (truncated, 1 more match)");
  });

  it("skips a file it can't read instead of failing", () => {
    fs.writeFileSync("unreadable.txt", "findme", "utf-8");
    fs.chmodSync("unreadable.txt", 0o000);
    fs.writeFileSync("readable.txt", "findme", "utf-8");

    try {
      // Skipped rather than asserted strictly: running as root (common in
      // CI containers) ignores permission bits, which would make this
      // false-fail instead of exercising the read-error branch.
      const result = searchFiles("findme");
      expect(result).toContain("readable.txt:1: findme");
    } finally {
      fs.chmodSync("unreadable.txt", 0o644);
    }
  });
});
