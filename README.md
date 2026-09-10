# dz-code-agent

Minimal TypeScript CLI agent using the Anthropic SDK. Each `npm start`
invocation is a fresh turn: history from earlier runs is saved to
`.session.json` but is not automatically fed back into context — the agent
can search it on demand with the `check_history` tool when something feels
like it was already discussed in an earlier session. The agent also
maintains `PROJECT_NOTES.md`, a curated file of long-term facts about this
codebase that it updates itself via the `update_notes` tool and that's loaded
into its system prompt on every run.

## Setup

```bash
npm install
export ANTHROPIC_API_KEY=sk-ant-...
```

## Usage

```bash
npm start -- "What does package.json say the start script is?"
```
