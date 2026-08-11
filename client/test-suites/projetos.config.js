import { defineConfig, mergeConfig } from "vitest/config";

import baseConfig from "../vite.config.js";

export default mergeConfig(baseConfig, defineConfig({
  test: {
    name: "integration-projetos",
    include: ["src/tests/integration/projetos/**/*.{test,spec}.{js,jsx}"],
    passWithNoTests: true
  }
}));
