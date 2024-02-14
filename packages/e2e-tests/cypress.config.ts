import { defineConfig } from "cypress";

import cypressReplay from "@replayio/cypress";

export default defineConfig({
  e2e: {
    defaultCommandTimeout: 30000,
    requestTimeout: 30000,
    baseUrl: "http://localhost:8080",
    screenshotOnRunFailure: false,
    video: false,
    setupNodeEvents(on, config) {
      cypressReplay(on, config);
      return config;
    },
  },
});
