import { describe, expect, it } from "vitest";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import { checkHistory } from "../../src/tools/check-history";
import { addToSessionHistory } from "../../src/session";
import { useTempCwd } from "../helpers/fs-fixture";

describe("checkHistory", () => {
  useTempCwd();

  it("reports no history when none has been saved", () => {
    expect(checkHistory("anything")).toBe("No past session history found.");
  });

  it("matches text, tool_use, and tool_result blocks", () => {
    const history: MessageParam[] = [
      { role: "user", content: "please read the config" },
      { role: "assistant", content: [{ type: "text", text: "Sure, checking now" }] },
      {
        role: "assistant",
        content: [{ type: "tool_use", id: "t1", name: "read_file", input: { path: "config.json" } }],
      },
      {
        role: "user",
        content: [{ type: "tool_result", tool_use_id: "t1", content: "file contents here" }],
      },
    ];
    addToSessionHistory(history);

    expect(checkHistory("checking")).toBe("[#1 assistant]: Sure, checking now");
    expect(checkHistory("read_file")).toBe(
      '[#2 assistant]: [called read_file({"path":"config.json"})]',
    );
    expect(checkHistory("file contents")).toBe(
      "[#3 user]: [tool result: file contents here]",
    );
  });

  it("reports no match when history exists but nothing matches", () => {
    addToSessionHistory([{ role: "user", content: "hello" }]);

    expect(checkHistory("nope")).toBe("No history matching /nope/.");
  });

  it("caps output at 20 matches and notes how many were omitted", () => {
    const history: MessageParam[] = Array.from({ length: 25 }, () => ({
      role: "user" as const,
      content: "findme",
    }));
    addToSessionHistory(history);

    const result = checkHistory("findme");

    expect(result.split("\n")).toHaveLength(21); // 20 matches + the note
    expect(result).toContain("... (truncated, 5 more matches)");
  });

  it("truncates an entry longer than 500 characters", () => {
    const longText = "findme " + "x".repeat(600);
    addToSessionHistory([{ role: "user", content: longText }]);

    const result = checkHistory("findme");

    expect(result).toBe(`[#0 user]: ${longText.slice(0, 500)}...`);
  });
});
