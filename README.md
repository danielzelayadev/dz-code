# dz-code-agent

Minimal TypeScript CLI agent using the Anthropic SDK. Each `npm start`
invocation is one turn in an ongoing conversation: history is saved to
`.session.json` after every run and reloaded on the next. The agent also
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
