import "../currentTestInfoWatcher";
import { test } from "@playwright/test";

import { toggleProtocolMessages } from "../utils/console";
import { getTestUrl } from "../utils/general";
import testSetup from "../utils/testSetup";

export function beforeEach() {
  testSetup("4f76b342-c7a8-467f-ad08-9fa885f10477");

  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(5000);

    await page.goto(getTestUrl("console"));
    await toggleProtocolMessages(page, true);
  });
}
