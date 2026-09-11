import { beforeEach, describe, expect, it, vi } from "vitest";
import fs from "fs";
import { buildSystemPrompt, runAgent } from "../src/agent";
import {
  createFakeClient,
  parallelToolUseResponse,
  textResponse,
  toolUseResponse,
} from "./helpers/fake-anthropic-client";
import { useTempCwd } from "./helpers/fs-fixture";

beforeEach(() => {
  // The loop logs every tool call/result to the console; silence it so test
  // output stays readable, without asserting on log content anywhere here.
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("buildSystemPrompt", () => {
  it("returns the same base prompt regardless of how many times it's called", () => {
    expect(buildSystemPrompt(null)).toBe(buildSystemPrompt(null));
  });

  it("appends the notes under a '## Project notes' heading when present", () => {
    const base = buildSystemPrompt(null);

    const result = buildSystemPrompt("Remember: use TDD.");

    expect(result).toBe(`${base}\n\n## Project notes\n\nRemember: use TDD.`);
  });
});

describe("runAgent", () => {
  useTempCwd();

  it("returns the model's text reply directly when it makes no tool calls", async () => {
    const client = createFakeClient(textResponse("The answer is 42."));

    const result = await runAgent(client, "what is the answer?", "system prompt");

    expect(result.answer).toBe("The answer is 42.");
    expect(client.messages.create).toHaveBeenCalledOnce();
  });

  it("runs a requested tool and feeds the result back for a final answer", async () => {
    fs.writeFileSync("hello.txt", "hi there", "utf-8");
    const client = createFakeClient(
      toolUseResponse("read_file", { path: "hello.txt" }, "call_1"),
      textResponse("The file says hi there."),
    );

    const result = await runAgent(client, "what's in hello.txt?", "system prompt");

    expect(result.answer).toBe("The file says hi there.");
    expect(client.messages.create).toHaveBeenCalledTimes(2);
    expect(result.messages).toHaveLength(4); // user Q, assistant tool_use, user tool_result, assistant text
    expect(result.messages[2]).toEqual({
      role: "user",
      content: [
        {
          type: "tool_result",
          tool_use_id: "call_1",
          content: expect.stringContaining("hi there"),
        },
      ],
    });
  });

  it("runs sequential tool calls across turns before the final answer", async () => {
    fs.writeFileSync("a.txt", "A", "utf-8");
    fs.writeFileSync("b.txt", "B", "utf-8");
    const client = createFakeClient(
      toolUseResponse("read_file", { path: "a.txt" }, "call_1"),
      toolUseResponse("read_file", { path: "b.txt" }, "call_2"),
      textResponse("Read both files."),
    );

    const result = await runAgent(client, "read a.txt then b.txt", "system prompt");

    expect(result.answer).toBe("Read both files.");
    expect(client.messages.create).toHaveBeenCalledTimes(3);
  });

  it("runs parallel tool calls from one turn and appends results in order", async () => {
    fs.writeFileSync("a.txt", "A", "utf-8");
    fs.writeFileSync("b.txt", "B", "utf-8");
    const client = createFakeClient(
      parallelToolUseResponse([
        { name: "read_file", input: { path: "a.txt" }, id: "call_a" },
        { name: "read_file", input: { path: "b.txt" }, id: "call_b" },
      ]),
      textResponse("Read both."),
    );

    const result = await runAgent(client, "read both files", "system prompt");

    expect(result.answer).toBe("Read both.");
    expect(client.messages.create).toHaveBeenCalledTimes(2);
    const toolResults = result.messages[2];
    expect(toolResults.content).toHaveLength(2);
    expect((toolResults.content as Array<{ tool_use_id: string }>)[0].tool_use_id).toBe("call_a");
    expect((toolResults.content as Array<{ tool_use_id: string }>)[1].tool_use_id).toBe("call_b");
  });

  it("reports an unknown tool as an error and keeps the loop going", async () => {
    const client = createFakeClient(
      toolUseResponse("not_a_real_tool", {}, "call_1"),
      textResponse("Sorry, I made that up."),
    );

    const result = await runAgent(client, "do something", "system prompt");

    expect(result.answer).toBe("Sorry, I made that up.");
    const toolResult = result.messages[2].content as Array<{
      is_error?: boolean;
      content: string;
    }>;
    expect(toolResult[0]).toMatchObject({
      is_error: true,
      content: "Unknown tool: not_a_real_tool",
    });
  });

  it("reports a missing required argument without invoking the handler", async () => {
    const client = createFakeClient(
      toolUseResponse("read_file", {}, "call_1"), // read_file requires "path"
      textResponse("Couldn't read anything."),
    );

    const result = await runAgent(client, "read something", "system prompt");

    expect(fs.readdirSync(".")).toEqual([]); // handler never ran, nothing was touched
    const toolResult = result.messages[2].content as Array<{
      is_error?: boolean;
      content: string;
    }>;
    expect(toolResult[0]).toMatchObject({
      is_error: true,
      content: "Missing required argument(s): path",
    });
  });

  it("catches a handler error and surfaces it as a tool result instead of throwing", async () => {
    const client = createFakeClient(
      toolUseResponse("read_file", { path: "does-not-exist.txt" }, "call_1"),
      textResponse("That file doesn't exist."),
    );

    const result = await runAgent(client, "read a missing file", "system prompt");

    expect(result.answer).toBe("That file doesn't exist.");
    const toolResult = result.messages[2].content as Array<{
      is_error?: boolean;
      content: string;
    }>;
    expect(toolResult[0].is_error).toBe(true);
    expect(toolResult[0].content).toContain("Error running read_file:");
    expect(toolResult[0].content).toContain("ENOENT");
  });

  it("never asks for confirmation before running a tool that doesn't require it", async () => {
    fs.writeFileSync("hello.txt", "hi there", "utf-8");
    const client = createFakeClient(
      toolUseResponse("read_file", { path: "hello.txt" }, "call_1"),
      textResponse("done"),
    );
    const confirm = vi.fn();

    await runAgent(client, "read hello.txt", "system prompt", confirm);

    expect(confirm).not.toHaveBeenCalled();
  });

  it("asks for confirmation before running run_bash, and runs it when approved", async () => {
    const client = createFakeClient(
      toolUseResponse("run_bash", { command: "echo hi" }, "call_1"),
      textResponse("done"),
    );
    const confirm = vi.fn().mockResolvedValue(true);

    const result = await runAgent(client, "run echo hi", "system prompt", confirm);

    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("DZ Code is asking permission"));
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("echo hi"));
    const toolResult = result.messages[2].content as Array<{ content: string }>;
    expect(toolResult[0].content).toContain("hi");
  });

  it("skips execution and reports the decline when the user rejects confirmation", async () => {
    const client = createFakeClient(
      toolUseResponse("run_bash", { command: "echo hi" }, "call_1"),
      textResponse("done"),
    );
    const confirm = vi.fn().mockResolvedValue(false);

    const result = await runAgent(client, "run echo hi", "system prompt", confirm);

    const toolResult = result.messages[2].content as Array<{
      is_error?: boolean;
      content: string;
    }>;
    expect(toolResult[0].is_error).toBeFalsy();
    expect(toolResult[0].content).toMatch(/declined/i);
  });
});
