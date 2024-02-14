import test, { expect } from "@playwright/test";

import examples from "../examples.json";
import { startTest } from "../helpers";

test("deleted-recording: Show error message for deleted recording", async ({ page }) => {
  await startTest(page, examples["deleted-replay"].recording, undefined, undefined, false);

  const error = page.locator('[data-test-id="ExpectedError"]');
  await error.waitFor({ timeout: 10_000 });

  expect(await error.isVisible()).toBe(true);
  expect(await error.textContent()).toContain("Recording Deleted");
});
