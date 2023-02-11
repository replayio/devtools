import cypressReplay from "@replayio/cypress";
import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    defaultCommandTimeout: 30000,
    requestTimeout: 30000,
    baseUrl: "http://localhost:3000",
    screenshotOnRunFailure: false,
    video: false,
    setupNodeEvents(on, config) {
      cypressReplay(on, config);
      return config;
    },
  },
});
