import { defineConfig, mergeConfig } from "vitest/config";

import baseConfig from "../vite.config.js";

export default mergeConfig(baseConfig, defineConfig({
  test: {
    name: "integration-chamados",
    include: [
      "src/tests/integration/chamados/**/*.{test,spec}.{js,jsx}",
      "src/tests/components/Chamado*.{test,spec}.{js,jsx}"
    ]
  }
}));
