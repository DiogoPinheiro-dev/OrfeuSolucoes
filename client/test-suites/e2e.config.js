import { defineConfig, mergeConfig } from "vitest/config";

import baseConfig from "../vite.config.js";

export default mergeConfig(baseConfig, defineConfig({
  test: {
    name: "e2e",
    include: ["src/tests/e2e/**/*.{test,spec}.{js,jsx}"],
    passWithNoTests: true
  }
}));
