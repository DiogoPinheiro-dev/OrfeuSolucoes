import { defineConfig, mergeConfig } from "vitest/config";

import baseConfig from "../vite.config.js";

export default mergeConfig(baseConfig, defineConfig({
  test: {
    name: "coverage",
    include: ["src/tests/**/*.{test,spec}.{js,jsx}"],
    fileParallelism: false,
    maxWorkers: 1,
    testTimeout: 15000,
    hookTimeout: 15000,
    coverage: {
      thresholds: {
        statements: 73,
        branches: 59,
        functions: 64,
        lines: 75
      }
    }
  }
}));
