import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    // Tests that chdir() (see test/helpers/fs-fixture.ts) need one OS
    // process per test file — chdir is process-global, and the default
    // "threads" pool runs files as threads sharing one process.
    pool: "forks",
    restoreMocks: true,
  },
});
