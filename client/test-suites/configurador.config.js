import { defineConfig, mergeConfig } from "vitest/config";

import baseConfig from "../vite.config.js";

export default mergeConfig(baseConfig, defineConfig({
  test: {
    name: "integration-configurador",
    include: [
      "src/tests/integration/configurador/**/*.{test,spec}.{js,jsx}",
      "src/tests/components/ConfiguratorManagement.{test,spec}.{js,jsx}"
    ]
  }
}));
