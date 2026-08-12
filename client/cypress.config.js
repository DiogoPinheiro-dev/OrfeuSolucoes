import { defineConfig } from "cypress";

export default defineConfig({
  allowCypressEnv: false,
  e2e: {
    baseUrl: "http://127.0.0.1:4173",
    specPattern: "cypress/e2e/**/*.cy.js",
    supportFile: "cypress/support/e2e.js",
    video: false,
  },
  screenshotsFolder: "cypress/artifacts/screenshots",
  videosFolder: "cypress/artifacts/videos",
});
