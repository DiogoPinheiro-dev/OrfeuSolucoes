import { defineConfig, mergeConfig } from "vitest/config";

import baseConfig from "../vite.config.js";

export default mergeConfig(baseConfig, defineConfig({
  test: {
    name: "regression",
    include: [
      "src/tests/auth/**/*.{test,spec}.{js,jsx}",
      "src/tests/contracts/**/*.{test,spec}.{js,jsx}",
      "src/tests/hooks/**/*.{test,spec}.{js,jsx}",
      "src/tests/services/**/*.{test,spec}.{js,jsx}",
      "src/tests/components/{ConfirmAction,CrudFeedback,CrudGrid,DocumentationCenter,DocumentationMarkdown,ModalDialogs,RouteLoadingFallback,SharedFields}.{test,spec}.{js,jsx}"
    ]
  }
}));
