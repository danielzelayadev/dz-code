/** Wraps console output in ANSI color codes when writing to an interactive terminal. */

const CODES = {
  bold: "1",
  red: "31",
  green: "32",
  yellow: "33",
  cyan: "36",
  gray: "90",
} as const;

/** True when colored output is appropriate: stdout is a TTY and NO_COLOR isn't set. */
export function isColorEnabled(): boolean {
  return Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;
}

function colorize(code: string, text: string): string {
  return isColorEnabled() ? `\x1b[${code}m${text}\x1b[0m` : text;
}

export function bold(text: string): string {
  return colorize(CODES.bold, text);
}

export function red(text: string): string {
  return colorize(CODES.red, text);
}

export function green(text: string): string {
  return colorize(CODES.green, text);
}

export function yellow(text: string): string {
  return colorize(CODES.yellow, text);
}

export function cyan(text: string): string {
  return colorize(CODES.cyan, text);
}

export function gray(text: string): string {
  return colorize(CODES.gray, text);
}
