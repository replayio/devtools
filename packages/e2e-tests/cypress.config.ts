import cypressReplay from "@replayio/cypress";
import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    defaultCommandTimeout: 30000,
    requestTimeout: 30000,
    baseUrl: "http://localhost:8080",
    screenshotOnRunFailure: false,
    video: false,
    reporter: "junit",
    reporterOptions: {
      mochaFile: "test-results/e2e-test-results-cypress-[hash].xml",
    },
    setupNodeEvents(on, config) {
      cypressReplay(on, config);
      return config;
    },
  },
});
