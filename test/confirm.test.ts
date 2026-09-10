import { Readable, Writable } from "stream";
import { describe, expect, it } from "vitest";
import { confirmAction } from "../src/confirm";

function fakeInput(answer: string): Readable {
  return Readable.from([answer]);
}

function fakeOutput(): { stream: Writable; written: () => string } {
  let written = "";
  const stream = new Writable({
    write(chunk, _enc, callback) {
      written += chunk.toString();
      callback();
    },
  });
  return { stream, written: () => written };
}

describe("confirmAction", () => {
  it("resolves true when the user types 'y'", async () => {
    const { stream, written } = fakeOutput();

    const result = await confirmAction("Do the thing?", fakeInput("y\n"), stream);

    expect(result).toBe(true);
    expect(written()).toContain("Do the thing?");
  });

  it("resolves true for uppercase 'Y' too", async () => {
    const { stream } = fakeOutput();

    const result = await confirmAction("Do the thing?", fakeInput("Y\n"), stream);

    expect(result).toBe(true);
  });

  it("resolves false when the user types 'n'", async () => {
    const { stream } = fakeOutput();

    const result = await confirmAction("Do the thing?", fakeInput("n\n"), stream);

    expect(result).toBe(false);
  });

  it("resolves false for an empty answer", async () => {
    const { stream } = fakeOutput();

    const result = await confirmAction("Do the thing?", fakeInput("\n"), stream);

    expect(result).toBe(false);
  });
});
