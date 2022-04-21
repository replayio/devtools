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
  // This API key allows access to the whole team that holds all these test
  // recordings. If someone wanted to, they could go in and delete the workspace
  // or recordings in it or anything. While thats not great, it's also not
  // the end of the world. If someone does that, we can always change
  // this code to only run in CI in the main repo and have this as a secret.
  // It's a lot easier to hardcode it for now though.
  // trunk-ignore(gitleaks/generic-api-key)
  replayApiKey: "rwk_7XPbO5fhz0bkhANYXtN2dkm74wNQCchXf2OxVgAerTQ",
  useExampleFile: !process.env.SHOULD_RECORD_EXAMPLES,
};
