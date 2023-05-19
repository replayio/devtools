import "../currentTestInfoWatcher";
import { test } from "@playwright/test";

import { getTestUrl } from "../utils/general";
import { goToLine, openSourceFile, waitForSourceContentsToStream } from "../utils/source";
import testSetup from "../utils/testSetup";
import { sourceId } from "./shared";

export function beforeEach(recordingId = "c9fffa00-ac71-48bc-adb2-52ae81588e85") {
  testSetup(recordingId);

  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(5000);

    await page.goto(getTestUrl("source-and-console"));
    await openSourceFile(page, sourceId);

    // Wait for source contents to finish streaming (loading and parsing)
    await waitForSourceContentsToStream(page, sourceId);
    await goToLine(page, sourceId, 1);
  });
}
