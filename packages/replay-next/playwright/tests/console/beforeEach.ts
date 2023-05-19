import "../currentTestInfoWatcher";
import { test } from "@playwright/test";

import testSetup from "../utils/testSetup";

export function beforeEach(recordingId: string = "4ccc9f9f-f0d3-4418-ac21-1b316e462a44") {
  testSetup(recordingId);

  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(5000);
  });
}
