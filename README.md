# dz-code-agent

Minimal TypeScript CLI agent using the Anthropic SDK. One tool (`read_file`),
one-shot invocation, no memory between runs.

## Setup

```bash
npm install
export ANTHROPIC_API_KEY=sk-ant-...
```

## Usage

```bash
npm start -- "What does package.json say the start script is?"
```
