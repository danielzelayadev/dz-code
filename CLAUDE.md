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

## Workflow

- Type-check before considering a change done: `npx tsc --noEmit`.
- Run the CLI to sanity-check behavior end-to-end when changing the agent
  loop or a tool: `npm start -- "your question"` (needs `ANTHROPIC_API_KEY`
  set in the environment).
- All changes need human approval before commit.
