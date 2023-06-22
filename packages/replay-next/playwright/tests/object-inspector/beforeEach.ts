import { test } from "@playwright/test";

import { toggleProtocolMessage, toggleProtocolMessages } from "../utils/console";
import { getTestUrl, waitForSession } from "../utils/general";
import testSetup from "../utils/testSetup";

export function beforeEach() {
  testSetup("bc6df6be-8305-4e1e-9eda-c1da63ef023d");

  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(5000);

    await page.goto(getTestUrl("console"));

    await waitForSession(page);

    await toggleProtocolMessages(page, false);
    await toggleProtocolMessage(page, "logs", true);
  });
}
