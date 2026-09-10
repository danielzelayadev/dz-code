import { describe, expect, it } from "vitest";
import fs from "fs";
import { listDirectory } from "../../src/tools/list-directory";
import { useTempCwd } from "../helpers/fs-fixture";

describe("listDirectory", () => {
  useTempCwd();

  it("defaults to the current directory", () => {
    fs.writeFileSync("file.txt", "", "utf-8");

    expect(listDirectory()).toBe("file.txt");
  });

  it("marks subdirectories with a trailing slash and leaves files alone", () => {
    fs.mkdirSync("subdir");
    fs.writeFileSync("file.txt", "", "utf-8");

    expect(listDirectory(".")).toBe("file.txt\nsubdir/");
  });

  it("sorts entries alphabetically regardless of creation order", () => {
    fs.writeFileSync("zebra.txt", "", "utf-8");
    fs.writeFileSync("apple.txt", "", "utf-8");
    fs.mkdirSync("mango");

    expect(listDirectory(".")).toBe("apple.txt\nmango/\nzebra.txt");
  });

  it("reports an empty directory", () => {
    fs.mkdirSync("empty");

    expect(listDirectory("empty")).toBe("(empty directory)");
  });

  it("throws when the path doesn't exist", () => {
    expect(() => listDirectory("nope")).toThrow(/ENOENT/);
  });
});
