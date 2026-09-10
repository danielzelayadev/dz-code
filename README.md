# dz-code-agent

Minimal TypeScript CLI agent using the Anthropic SDK. Each `npm start`
invocation is a fresh turn: history from earlier runs is saved to
`.session.json` but is not automatically fed back into context — the agent
can search it on demand with the `check_history` tool when something feels
like it was already discussed in an earlier session. The agent also
maintains `PROJECT_NOTES.md` (capped at 4000 characters), a curated file of
long-term facts about this codebase that's loaded into its system prompt on
every run. It updates the file itself via the `update_notes` tool, which
rewrites the entire file each call — pruning stale entries and folding in
new ones — rather than appending. Because the system prompt is built once at
the start of each run, a note written mid-run won't be visible to the model
in its own system prompt until the *next* `npm start` invocation.

## Setup

```bash
npm install
export ANTHROPIC_API_KEY=sk-ant-...
```

## Usage

```bash
npm start -- "What does package.json say the start script is?"
```
