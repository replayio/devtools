import { Page } from "@recordreplay/playwright";
import config from "../config";
import TestHarness from "../harness";
import { runPlaywrightTest } from "../runTest";

async function toggleFilterOn(page: Page, id: string) {
  const selector = `[data-test-id="FilterToggle-${id}"]`;
  const isChecked = await page.evaluate(
    selector => {
      const input = document.querySelector(`${selector} input`);
      return (input as HTMLInputElement).checked;
    },
    [selector]
  );

  if (!isChecked) {
    await page.click(selector);
  }
}

it("Test source mapping of console errors.", async () => {
  // Not supported on chromium, needs source maps.
  // https://github.com/RecordReplay/chromium/issues/5
  if (config.browserName !== "firefox" && !config.shouldSaveCoverageData) {
    return;
  }
  await runPlaywrightTest({
    example: "doc_exceptions_bundle.html",
    script: async page => {
      const harness = new TestHarness(page);
      await harness.start();

      await toggleFilterOn(page, "exceptions");
      await toggleFilterOn(page, "warnings");
      await page.click('[data-test-id="PanelButton-console"]');

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
