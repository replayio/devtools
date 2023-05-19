import "../currentTestInfoWatcher";
import { test } from "@playwright/test";

import { getTestUrl } from "../utils/general";
import testSetup from "../utils/testSetup";

export function beforeEach() {
  testSetup("b1849642-40a3-445c-96f8-4bcd2c35586e");

  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(5000);

    await page.goto(getTestUrl("source-preview"));
  });
}
