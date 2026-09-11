import { afterEach, describe, expect, it } from "vitest";
import { bold, cyan, gray, green, isColorEnabled, red, yellow } from "../src/colors";

/** Restores whatever isTTY/NO_COLOR looked like before each test tweaked them. */
function stubTTY(value: boolean | undefined) {
  const stdout = process.stdout as { isTTY?: boolean };
  const original = stdout.isTTY;
  stdout.isTTY = value;
  return () => {
    stdout.isTTY = original;
  };
}

describe("isColorEnabled", () => {
  const originalNoColor = process.env.NO_COLOR;
  let restoreTTY: () => void;

  afterEach(() => {
    restoreTTY();
    if (originalNoColor === undefined) delete process.env.NO_COLOR;
    else process.env.NO_COLOR = originalNoColor;
  });

  it("is true when stdout is a TTY and NO_COLOR is unset", () => {
    delete process.env.NO_COLOR;
    restoreTTY = stubTTY(true);

    expect(isColorEnabled()).toBe(true);
  });

  it("is false when stdout is not a TTY", () => {
    delete process.env.NO_COLOR;
    restoreTTY = stubTTY(undefined);

    expect(isColorEnabled()).toBe(false);
  });

  it("is false when NO_COLOR is set, even on a TTY", () => {
    process.env.NO_COLOR = "1";
    restoreTTY = stubTTY(true);

    expect(isColorEnabled()).toBe(false);
  });
});

describe("color wrappers", () => {
  const originalNoColor = process.env.NO_COLOR;
  let restoreTTY: () => void;

  afterEach(() => {
    restoreTTY();
    if (originalNoColor === undefined) delete process.env.NO_COLOR;
    else process.env.NO_COLOR = originalNoColor;
  });

  it("wrap text in ANSI codes when color is enabled", () => {
    delete process.env.NO_COLOR;
    restoreTTY = stubTTY(true);

    expect(green("ok")).toBe("\x1b[32mok\x1b[0m");
    expect(red("fail")).toBe("\x1b[31mfail\x1b[0m");
    expect(yellow("warn")).toBe("\x1b[33mwarn\x1b[0m");
    expect(cyan("info")).toBe("\x1b[36minfo\x1b[0m");
    expect(gray("dim")).toBe("\x1b[90mdim\x1b[0m");
    expect(bold("!")).toBe("\x1b[1m!\x1b[0m");
  });

  it("pass text through unchanged when color is disabled", () => {
    delete process.env.NO_COLOR;
    restoreTTY = stubTTY(undefined);

    expect(green("ok")).toBe("ok");
    expect(red("fail")).toBe("fail");
    expect(yellow("warn")).toBe("warn");
    expect(cyan("info")).toBe("info");
    expect(gray("dim")).toBe("dim");
    expect(bold("!")).toBe("!");
  });
});
