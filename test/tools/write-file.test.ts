import { describe, expect, it } from "vitest";
import fs from "fs";
import { writeFile } from "../../src/tools/write-file";
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
