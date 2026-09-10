import { describe, expect, it, vi } from "vitest";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import {
  addToSessionHistory,
  clearSessionHistory,
  loadSessionHistory,
} from "../src/session";
import { useTempCwd } from "./helpers/fs-fixture";
import fs from "fs";

// session.ts keeps its filename private; mirrored here since tests need to
// seed/inspect it directly.
const SESSION_FILE = ".session.json";

describe("loadSessionHistory", () => {
  useTempCwd();

  it("returns an empty history when the file doesn't exist", () => {
    expect(loadSessionHistory()).toEqual([]);
  });

  it("returns the parsed history when the file exists", () => {
    const history: MessageParam[] = [{ role: "user", content: "hi" }];
    fs.writeFileSync(SESSION_FILE, JSON.stringify(history), "utf-8");

    expect(loadSessionHistory()).toEqual(history);
  });

  it("falls back to an empty history and warns when the file is corrupt", () => {
    fs.writeFileSync(SESSION_FILE, "not valid json{{{", "utf-8");
    const warn = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(loadSessionHistory()).toEqual([]);
    expect(warn).toHaveBeenCalledOnce();
  });
});

describe("addToSessionHistory", () => {
  useTempCwd();

  it("creates the file when none existed", () => {
    const messages: MessageParam[] = [{ role: "user", content: "hi" }];

    addToSessionHistory(messages);

    expect(loadSessionHistory()).toEqual(messages);
  });

  it("appends to and persists existing history", () => {
    const first: MessageParam[] = [{ role: "user", content: "first" }];
    const second: MessageParam[] = [{ role: "assistant", content: "second" }];
    addToSessionHistory(first);

    addToSessionHistory(second);

    expect(loadSessionHistory()).toEqual([...first, ...second]);
  });
});

describe("clearSessionHistory", () => {
  useTempCwd();

  it("deletes the file and returns true when one exists", () => {
    addToSessionHistory([{ role: "user", content: "hi" }]);

    expect(clearSessionHistory()).toBe(true);
    expect(fs.existsSync(SESSION_FILE)).toBe(false);
  });

  it("returns false when there's nothing to clear", () => {
    expect(clearSessionHistory()).toBe(false);
  });
});
