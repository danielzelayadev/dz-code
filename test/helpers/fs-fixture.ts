import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach } from "vitest";

/**
 * Runs each test in a throwaway temp directory, chdir'd into for the
 * duration of the test. Lets session.ts/notes.ts/tools tests exercise real
 * fs behavior (ENOENT, real truncation, ...) without touching the repo's
 * own files.
 */
export function useTempCwd(): void {
  let dir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "dz-code-test-"));
    process.chdir(dir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(dir, { recursive: true, force: true });
  });
}
