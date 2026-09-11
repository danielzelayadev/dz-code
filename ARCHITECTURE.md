# Architecture

This document explains *why* DZ Code is shaped the way it is. For the file
layout and code-style conventions, see [CLAUDE.md](CLAUDE.md); for how to run
it, see [README.md](README.md).

## Overview

Each `npm start` invocation is one turn, not a long-running process. There's
no server, no in-memory state that survives between runs — everything the
agent "remembers" lives in two files on disk (`PROJECT_NOTES.md` and
`.session.json`), read at the start of a run and written at the end. This
keeps the system simple to reason about at the cost of the agent never
seeing its own output mid-run (more on that below).

## The agentic loop

[`runAgent`](src/agent.ts) is the whole loop:

1. Send the conversation so far, the system prompt, and the tool
   definitions to the model.
2. If the response contains no `tool_use` blocks, it's a final answer —
   return it.
3. Otherwise, run every tool call **in order** via the [tool
   registry](#tool-registry-pattern) — sequentially, not in parallel, so
   that any [confirmation prompts](#confirmation-gate) they trigger are
   asked one at a time instead of interleaving on the terminal — turn
   each outcome into a `tool_result` block, and append both the model's
   message and the tool results to the conversation.
4. Go back to step 1.

The system prompt (including project notes) is built once, before the loop
starts. That means a note written by `update_notes` partway through a run
isn't visible to the model until the *next* `npm start` invocation — an
intentional simplification rather than an oversight, consistent with
"no long-running process."

## Tool registry pattern

Each tool is one file under `src/tools/` exporting two things together: its
JSON-schema `Tool` definition (what the model sees) and its handler
function (what actually runs). Keeping schema and implementation in the
same file means a tool is a single, self-contained concern — reading
`read-file.ts` tells you everything about `read_file`, with nothing to
cross-reference elsewhere.

[`src/tools/index.ts`](src/tools/index.ts) is the only place that knows
about *all* the tools: it imports each one and wires it into `TOOLS`, a
`name → { tool, handler, confirmation? }` map that `agent.ts` dispatches
against (see [confirmation gate](#confirmation-gate) for that optional
third field), and derives `TOOL_LIST` (just the schemas) to hand to the
API. Adding a new tool means adding one file under `src/tools/` and one
entry in that map — `agent.ts` itself never changes.

## Confirmation gate

`run_bash` can do real damage, and `write_file`/`edit_file` can destroy
work that isn't recoverable elsewhere — so some tool calls pause and ask
the terminal user to approve them before they run. This is the app's
first interactive, stdin-reading behavior, which is why tool dispatch in
the loop above had to become sequential-async instead of firing every
call at once: two confirmation prompts printing over each other would be
unusable.

A `ToolDefinition` ([src/tools/tool-definition.ts](src/tools/tool-definition.ts))
may carry an optional `confirmation: { isRequired, summarize, describe }`.
Before `agent.ts` invokes a tool's handler, it checks `isRequired(input)`;
if true, it combines `summarize(input)` (a short human phrase, e.g. "edit
file.txt") and `describe(input)` (the technical detail — the exact
command, or old/new content) via
[`buildConfirmationMessage`](src/confirm.ts) into a message like "DZ Code
is asking permission to edit file.txt. Details: ...", and awaits the
user's answer via [`confirmAction`](src/confirm.ts) (a thin `readline`
wrapper, injected into `runAgent` as a `confirm` parameter the same way
the Anthropic client is, so tests supply a fake instead of touching the
real TTY). A decline returns a normal (non-`is_error`) `tool_result`
telling the model the action was skipped, so it can propose something
else instead of treating it as a bug to retry.

`run_bash`'s `isRequired` is always `true`. `write_file`/`edit_file`'s
`isRequired` is `!isGitRecoverable(path)` ([src/git.ts](src/git.ts)),
which shells out to `git check-ignore` — a file git already tracks (or
would track) can be recovered with `git diff`/`checkout`, so touching it
doesn't need a prompt; a gitignored file, or any file outside a git repo
at all, can't be recovered that way, so it does.

## Two persistence strategies, deliberately different

The agent has two on-disk memory files, and they're intentionally *not*
handled the same way:

- **`PROJECT_NOTES.md`** ([src/notes.ts](src/notes.ts)) is curated,
  size-capped (`MAX_NOTES_LENGTH`, 4000 characters), and loaded into the
  system prompt on *every* run. `update_notes` rewrites the whole file each
  time rather than appending, because the point is a clean, current summary
  of durable facts (architecture, conventions, past mistakes) — not a
  growing log. This is memory the model is expected to actively maintain.

- **`.session.json`** ([src/session.ts](src/session.ts)) is an
  append-only, unbounded transcript of every past run. It's deliberately
  *not* loaded into the system prompt automatically — doing so would make
  every run more expensive and less focused as history grows. Instead it's
  archival: searchable on demand via the `check_history` tool when
  something feels like it was discussed in an earlier session.

In short: notes are small and always-on; history is large and
searched-when-needed.

## Testing boundaries

Tests never touch the real Anthropic API or the real filesystem:

- [`test/helpers/fake-anthropic-client.ts`](test/helpers/fake-anthropic-client.ts)
  provides a fake `{ messages: { create: vi.fn() } }` client — `runAgent`
  takes the client as a parameter specifically so a real one is never
  required in tests.
- [`test/helpers/fs-fixture.ts`](test/helpers/fs-fixture.ts) creates and
  `chdir`s into a throwaway temp directory, so `session.ts`, `notes.ts`,
  and the tools never read or write files in the actual repo.
- The terminal itself is a boundary too: `runAgent` takes `confirm` as a
  parameter the same way it takes the Anthropic client, so tests pass a
  `vi.fn()` instead of blocking on real stdin, and
  [`confirmAction`](src/confirm.ts) takes its input/output streams as
  parameters so its own test can feed it a fake stream instead of the
  real TTY.

See the **Testing** section in [CLAUDE.md](CLAUDE.md) for the full TDD
workflow these fixtures support.
