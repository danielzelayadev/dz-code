/** Checks whether a path is one git can recover changes to. */
import { execFileSync } from "child_process";

/**
 * True when git would track changes to this path — i.e. it's not
 * gitignored and the current directory is a git repo. False (fail safe,
 * requiring confirmation) when the path is gitignored, or when git can't
 * answer at all (no repo, git missing, ...).
 */
export function isGitRecoverable(path: string): boolean {
  try {
    execFileSync("git", ["check-ignore", "--quiet", path], { stdio: "ignore" });
    return false; // exit 0: path is ignored
  } catch (err) {
    return (err as { status?: number }).status === 1; // exit 1: not ignored, git tracks it
  }
}
