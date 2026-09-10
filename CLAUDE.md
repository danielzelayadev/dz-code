# CLAUDE.md

Conventions for this repo. Follow these for any new code, not just the CLI agent.

## Code style

- **Small functions.** Each function does one thing and its name says what that
  thing is. If a function needs a comment to explain _what_ it does, split it
  instead — comments are for _why_, not _what_.
- **Small files.** A file holds one responsibility. When a file starts covering
  more than one concern, split it before adding more code to it, not after.
- **SOLID, pragmatically.** Single responsibility is what "small functions" /
  "small files" above already give you. Beyond that: depend on the narrowest
  type a function actually needs (e.g. take a single `ToolUseBlock`, not the
  whole response) rather than reaching into a bigger object for one field.
- **Read top-to-bottom like prose.** The entry point (`main`, or a module's
  main export) should read as a short summary of what happens; the supporting
  functions it calls do the detail work and sit below it.
- **No dead flexibility.** Don't add config, abstraction layers, or options
  the current code doesn't need. Minimal and correct beats general and
  speculative.

## File organization

Group code by responsibility, not by kind:

```
src/
  index.ts          entry point — wires everything together, ~10 lines
  cli.ts            reading/validating input from the outside world (env, argv)
  agent.ts          the agentic loop: call the model, dispatch tool calls
  tools/
    read-file.ts    one tool: its schema + its implementation, together
```

- Each tool gets its own file under `src/tools/`, exporting its schema
  (`Tool`) and its handler together — they're one concern.
- Orchestration (the agentic loop) and I/O boundaries (CLI parsing) are
  separate files from the tools they use.
- When `src/tools/` grows past a couple of files, add a small registry
  (name → handler map) instead of a hand-written `if`/`switch` chain in
  `agent.ts`.

## Naming

- Function names are verbs describing the action (`runAgent`, `readFile`,
  `requireApiKey`), not nouns.
- Boolean-returning helpers read as predicates (`isToolUseBlock`).
- Prefer one clear name over a shorter ambiguous one.

## Testing

- **Test-first for every new feature.** Before writing implementation code,
  write tests that describe the behavior you're adding and watch them fail.
  Only then write the code to make them pass. Don't write production code
  a test doesn't already require.
- **Existing code needs coverage too.** The suite for code that predates
  this rule is being backfilled incrementally — when you touch an untested
  file for any reason, add tests for the behavior you touched (at minimum)
  before changing it.
- **Mock external boundaries, don't hit them for real.** Tests never call
  the real Anthropic API or touch real repo files:
  - The Anthropic client: pass a fake object shaped like
    `{ messages: { create: vi.fn() } }` — `runAgent` already takes the
    client as a parameter, so a real network call is never needed. See
    `test/helpers/fake-anthropic-client.ts`.
  - The filesystem: fs-touching code (`session.ts`, `notes.ts`,
    `tools/*.ts`) is tested against a throwaway temp directory created and
    `chdir`'d into for the test, never the repo's own files. See
    `test/helpers/fs-fixture.ts`.
- Test files live under `test/`, mirroring `src/` 1:1 — `src/notes.ts` →
  `test/notes.test.ts`, `src/tools/read-file.ts` →
  `test/tools/read-file.test.ts`.

## Workflow

- **Keep docs in sync with every feature.** When a change adds or changes
  user-visible behavior (a new tool, CLI flag, command, or dependency),
  update the README and any other affected doc (e.g. `package.json`
  scripts/description/version, `.env.example`) in the same change — not as
  a follow-up.
- **Keep design docs in sync too.** When a change alters *why* the code is
  shaped the way it is (a new persistence strategy, a new architectural
  pattern, a changed tradeoff), update [ARCHITECTURE.md](ARCHITECTURE.md)
  in the same change. When a file's single responsibility changes, or a
  new file is added, update or add its one-line header comment at the top
  of the file.
- Type-check before considering a change done: `npx tsc --noEmit` and
  `npx tsc -p tsconfig.test.json --noEmit`.
- Run the test suite and make sure it's green: `npm test`. A change is not
  done until its new or updated tests pass.
- Run the CLI to sanity-check behavior end-to-end when changing the agent
  loop or a tool: `npm start -- "your question"` (needs `ANTHROPIC_API_KEY`
  set in the environment).
- All changes need human approval before commit — human review happens
  only once `npx tsc --noEmit`, `npx tsc -p tsconfig.test.json --noEmit`,
  and `npm test` are all green.
