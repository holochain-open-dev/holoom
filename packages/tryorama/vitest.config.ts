import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    testTimeout: 60 * 1000 * 3, // 3  mins
    isolate: false,
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
  },
});
