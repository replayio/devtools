import { BrowserName } from "./recordPlaywright";

export default {
  backendUrl: process.env.DISPATCH_ADDRESS || "wss://dispatch.replay.io",
  browserName: (process.env.RECORD_REPLAY_TARGET === "chromium"
    ? "chromium"
    : "firefox") as BrowserName,
  browserPath: process.env.RECORD_REPLAY_PATH,
  devtoolsUrl: process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:8080",
  driverPath: process.env.RECORD_REPLAY_DRIVER,
  headless: !!process.env.RECORD_REPLAY_PLAYWRIGHT_HEADLESS,
  nodePath: process.env.RECORD_REPLAY_NODE,
  updateFixtures: !!process.env.SHOULD_UPDATE_FIXTURES,
  useExampleFile: !process.env.SHOULD_RECORD_EXAMPLES,
};
