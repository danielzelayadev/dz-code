import { describe, expect, it } from "vitest";
import fs from "fs";
import { readFile } from "../../src/tools/read-file";
import { useTempCwd } from "../helpers/fs-fixture";

describe("readFile", () => {
  useTempCwd();

  it("numbers lines 1-based, padded to 4 chars and tab-separated", () => {
    fs.writeFileSync("short.txt", "first\nsecond", "utf-8");

    expect(readFile("short.txt")).toBe("   1\tfirst\n   2\tsecond");
  });

  it("truncates files over 300 lines and reports how many were omitted", () => {
    const lines = Array.from({ length: 305 }, (_, i) => `line ${i + 1}`);
    fs.writeFileSync("long.txt", lines.join("\n"), "utf-8");

    const result = readFile("long.txt");

    expect(result.split("\n")).toHaveLength(301); // 300 numbered lines + the note
    expect(result).toContain("... (truncated, 5 more lines)");
  });

  it("uses the singular form when exactly one line is omitted", () => {
    const lines = Array.from({ length: 301 }, (_, i) => `line ${i + 1}`);
    fs.writeFileSync("long.txt", lines.join("\n"), "utf-8");

    expect(readFile("long.txt")).toContain("... (truncated, 1 more line)");
  });

  it("doesn't truncate a file at exactly 300 lines", () => {
    const lines = Array.from({ length: 300 }, (_, i) => `line ${i + 1}`);
    fs.writeFileSync("exact.txt", lines.join("\n"), "utf-8");

    expect(readFile("exact.txt")).not.toContain("truncated");
  });

  it("propagates the error when the file doesn't exist", () => {
    expect(() => readFile("missing.txt")).toThrow(/ENOENT/);
  });
});
