import config from "../config";
import TestHarness from "../harness";
import { runPlaywrightTest } from "../runTest";

it("Test source mapping of console errors.", async () => {
  // Not supported on chromium, needs source maps.
  // https://github.com/RecordReplay/chromium/issues/5
  if (config.browserName !== "firefox") {
    return;
  }
  await runPlaywrightTest({
    example: "doc_exceptions_bundle.html",
    script: async page => {
      const harness = new TestHarness(page);
      await harness.start();

      await page.evaluate(() => app.actions.logExceptions(true));
      await page.evaluate(() => app.actions.filterToggled("warn"));
      await page.click("button.console-panel-button");

      await harness.waitForMessage("console.trace() ConsoleTrace");
      await harness.waitForMessage("ConsoleWarn");
      await harness.waitForMessage("ConsoleError");
      await harness.waitForMessage("Assertion failed: ConsoleAssert");
      await harness.waitForMessage("Error: UncaughtError");
      await harness.waitForMessage("Object { number: 42 }");
      await harness.waitForMessage("Object { number: 12 }");
      await harness.waitForMessage("uncaught exception: [object Object]");
    },
  });
});
