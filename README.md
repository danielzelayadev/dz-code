# DZ Code

An in-progress coding agent in the same spirit as tools like Claude
Code — a CLI you point at a local codebase with a question, built from
scratch in TypeScript on the Anthropic SDK to learn how these agents work
under the hood. It's currently a small, hand-rolled agentic loop plus a
handful of purpose-built tools rather than a full-featured framework, and
is very much still growing.

## Features

- **Codebase exploration & edits** — `read_file`, `list_directory`, and
  `search_files` (regex grep) let the agent gather context before
  answering; `write_file` creates or overwrites files when asked.
- **Long-term project notes** — the agent maintains `PROJECT_NOTES.md`
  (capped at 4000 characters) via the `update_notes` tool, which rewrites
  the whole file each time — pruning stale entries and folding in new
  ones — rather than appending. It's loaded into the system prompt on
  every run.
- **Searchable session history** — every run's transcript is appended to
  `.session.json`. That history isn't auto-loaded into context (to keep
  runs cheap and focused), but the agent can search it on demand with
  `check_history` when something feels like it was already discussed in
  an earlier session.
- **Memory reset flags** — `--clear-history` and `--clear-notes` wipe the
  session log and/or the notes file.

## Requirements

- Node.js 20.6+ (for `--env-file-if-exists`)
- An [Anthropic API key](https://console.anthropic.com/)

## Setup

```bash
npm install
cp .env.example .env
```

Then edit `.env` and set `ANTHROPIC_API_KEY` to your key.

## Usage

```bash
npm start -- "What does package.json say the start script is?"
```

Clear saved memory when you want a clean slate:

```bash
npm start -- --clear-history
npm start -- --clear-notes
npm start -- --clear-history --clear-notes
```

## How it works

Each `npm start` invocation is a fresh turn — there's no long-running
process. The agentic loop ([src/agent.ts](src/agent.ts)) sends the
question to the model along with the tool definitions, runs whatever
tools the model calls, and feeds the results back until it replies with
plain text. Because the system prompt (notes included) is built once at
the start of a run, a note written mid-run won't be visible to the model
until the *next* invocation.

## Testing

This project follows test-driven development — see the **Testing**
section in [CLAUDE.md](CLAUDE.md) for the house rules (tests first, mock
the Anthropic client and the filesystem, `test/` mirrors `src/`).

```bash
npm test          # run the suite once
npm run test:watch  # re-run on file changes
```

A change isn't done until `npm test`, `npx tsc --noEmit`, and
`npx tsc -p tsconfig.test.json --noEmit` are all clean.

## Project structure

```
src/
  index.ts          entry point — wires everything together
  cli.ts            reads/validates input from argv and env
  agent.ts          the agentic loop: call the model, dispatch tool calls
  session.ts        .session.json persistence
  notes.ts          PROJECT_NOTES.md persistence
  tools/            one file per tool — schema + handler together
test/               mirrors src/ 1:1, one <name>.test.ts per source file
  helpers/          shared test fixtures (fake Anthropic client, temp-dir fs)
```

See [CLAUDE.md](CLAUDE.md) for the full set of code style and workflow
conventions this repo follows.

## License

[MIT](LICENSE)
