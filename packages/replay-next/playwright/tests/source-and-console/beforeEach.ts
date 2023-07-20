import { test } from "@playwright/test";

import { getTestUrl, waitForSession } from "../utils/general";
import { goToLine, openSourceFile, waitForSourceContentsToStream } from "../utils/source";
import testSetup from "../utils/testSetup";
import { sourceId } from "./shared";

export function beforeEach(
  recordingId = "ecc98f8d-5c5b-4218-a329-2168276164d1",
  additionalQueryParams: string[] = []
) {
  testSetup(recordingId);

  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(5000);

    await page.goto(getTestUrl("source-and-console", additionalQueryParams));

    await waitForSession(page);

    await openSourceFile(page, sourceId);

    // Wait for source contents to finish streaming (loading and parsing)
    await waitForSourceContentsToStream(page, sourceId);
    await goToLine(page, sourceId, 1);
  });
}
