import { describe, expect, it, vi } from "vitest";
import fs from "fs";
import { runClear } from "../src/index";
import { NOTES_FILE } from "../src/notes";
import { useTempCwd } from "./helpers/fs-fixture";

const SESSION_FILE = ".session.json"; // mirrors session.ts's private constant

describe("runClear", () => {
  useTempCwd();

  it("clears session history when history is requested", () => {
    fs.writeFileSync(SESSION_FILE, "[]", "utf-8");
    fs.writeFileSync(NOTES_FILE, "some notes", "utf-8");
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    runClear({ history: true, notes: false });

    expect(fs.existsSync(SESSION_FILE)).toBe(false);
    expect(fs.existsSync(NOTES_FILE)).toBe(true); // untouched
    expect(log).toHaveBeenCalledWith("Cleared session history (.session.json).");
  });

  it("reports nothing to clear when history is requested but absent", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    runClear({ history: true, notes: false });

    expect(log).toHaveBeenCalledWith("No session history to clear.");
  });

  it("clears project notes when notes is requested", () => {
    fs.writeFileSync(SESSION_FILE, "[]", "utf-8");
    fs.writeFileSync(NOTES_FILE, "some notes", "utf-8");
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    runClear({ history: false, notes: true });

    expect(fs.existsSync(NOTES_FILE)).toBe(false);
    expect(fs.existsSync(SESSION_FILE)).toBe(true); // untouched
    expect(log).toHaveBeenCalledWith("Cleared project notes (PROJECT_NOTES.md).");
  });

  it("reports nothing to clear when notes is requested but absent", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    runClear({ history: false, notes: true });

    expect(log).toHaveBeenCalledWith("No project notes to clear.");
  });

  it("clears both when both are requested", () => {
    fs.writeFileSync(SESSION_FILE, "[]", "utf-8");
    fs.writeFileSync(NOTES_FILE, "some notes", "utf-8");

    runClear({ history: true, notes: true });

    expect(fs.existsSync(SESSION_FILE)).toBe(false);
    expect(fs.existsSync(NOTES_FILE)).toBe(false);
  });
});
