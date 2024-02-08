import test, { expect } from "@playwright/test";

import { startTest } from "../helpers";

const deletedRecordingId = "94f1729a-3aab-449b-98d6-10865a5e83c5";

test("deleted-recording: Show error message for deleted recording", async ({ page }) => {
  await startTest(page, deletedRecordingId, undefined, undefined, false);

  const error = page.locator('[data-test-id="Error-RecordingDeleted"]');
  await error.waitFor({ timeout: 10_000 });
  expect(await error.isVisible()).toBe(true);
});
