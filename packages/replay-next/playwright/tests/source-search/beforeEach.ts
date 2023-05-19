import { test } from "@playwright/test";

import { getTestUrl } from "../utils/general";
import testSetup from "../utils/testSetup";

export function beforeEach() {
  testSetup("c9fffa00-ac71-48bc-adb2-52ae81588e85");

  test.beforeEach(async ({ page }, testInfo) => {
    page.setDefaultTimeout(5000);

    await page.goto(getTestUrl("source-search"));
  });
}
