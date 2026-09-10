import { afterEach, describe, expect, it, vi } from "vitest";
import { parseClearFlags, requireApiKey, requireQuestion } from "../src/cli";

/** Stubs process.exit to throw instead of actually killing the test process. */
function stubProcessExit() {
  return vi.spyOn(process, "exit").mockImplementation((code): never => {
    throw new Error(`process.exit(${code})`);
  });
}

describe("requireApiKey", () => {
  const originalApiKey = process.env.ANTHROPIC_API_KEY;

  afterEach(() => {
    process.env.ANTHROPIC_API_KEY = originalApiKey;
  });

  it("returns the key when it's set", () => {
    process.env.ANTHROPIC_API_KEY = "test-key";

    expect(requireApiKey()).toBe("test-key");
  });

  it("logs an error and exits(1) when unset", () => {
    delete process.env.ANTHROPIC_API_KEY;
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const exit = stubProcessExit();

    expect(() => requireApiKey()).toThrow("process.exit(1)");

    expect(error).toHaveBeenCalledWith(
      "Error: ANTHROPIC_API_KEY environment variable is not set.",
    );
    expect(exit).toHaveBeenCalledWith(1);
  });
});

describe("requireQuestion", () => {
  const originalArgv = process.argv;

  afterEach(() => {
    process.argv = originalArgv;
  });

  it("returns the question from argv[2]", () => {
    process.argv = [...originalArgv.slice(0, 2), "what does this file do?"];

    expect(requireQuestion()).toBe("what does this file do?");
  });

  it("logs usage instructions and exits(1) when no question is given", () => {
    process.argv = originalArgv.slice(0, 2);
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const exit = stubProcessExit();

    expect(() => requireQuestion()).toThrow("process.exit(1)");

    expect(error).toHaveBeenCalledWith(
      'Usage: npm start -- "your question about the codebase"\n' +
        "   or: npm start -- --clear-history [--clear-notes]  (clear saved memory)",
    );
    expect(exit).toHaveBeenCalledWith(1);
  });
});

describe("parseClearFlags", () => {
  const originalArgv = process.argv;

  afterEach(() => {
    process.argv = originalArgv;
  });

  function argvWith(...flags: string[]) {
    process.argv = [...originalArgv.slice(0, 2), ...flags];
  }

  it("detects --clear-history on its own", () => {
    argvWith("--clear-history");

    expect(parseClearFlags()).toEqual({ history: true, notes: false });
  });

  it("detects --clear-notes on its own", () => {
    argvWith("--clear-notes");

    expect(parseClearFlags()).toEqual({ history: false, notes: true });
  });

  it("detects both flags together", () => {
    argvWith("--clear-history", "--clear-notes");

    expect(parseClearFlags()).toEqual({ history: true, notes: true });
  });

  it("returns both false when neither flag is passed", () => {
    argvWith("some question");

    expect(parseClearFlags()).toEqual({ history: false, notes: false });
  });
});
