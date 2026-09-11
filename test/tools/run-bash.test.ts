import { describe, expect, it } from "vitest";
import { runBash, runBashConfirmation } from "../../src/tools/run-bash";
import { useTempCwd } from "../helpers/fs-fixture";

describe("runBash", () => {
  useTempCwd();

  it("captures stdout from a successful command", () => {
    const result = runBash("echo hello");

    expect(result).toContain("hello");
    expect(result).toContain("exit code: 0");
  });

  it("captures stderr", () => {
    const result = runBash("echo oops 1>&2");

    expect(result).toContain("oops");
  });

  it("surfaces a nonzero exit code without throwing", () => {
    const result = runBash("exit 3");

    expect(result).toContain("exit code: 3");
  });
});

describe("runBashConfirmation", () => {
  it("always requires confirmation", () => {
    expect(runBashConfirmation.isRequired({ command: "ls" })).toBe(true);
  });

  it("describes the command", () => {
    expect(runBashConfirmation.describe({ command: "rm -rf /" })).toContain("rm -rf /");
  });

  it("summarizes the action without the raw command", () => {
    expect(runBashConfirmation.summarize({ command: "rm -rf /" })).toContain("shell command");
  });
});
