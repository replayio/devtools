import { test } from "@playwright/test";

import { toggleProtocolMessage, toggleProtocolMessages } from "../utils/console";
import { getTestUrl } from "../utils/general";
import testSetup from "../utils/testSetup";

export function beforeEach() {
  testSetup("bc6df6be-8305-4e1e-9eda-c1da63ef023d");

  test.beforeEach(async ({ page }, testInfo) => {
    page.setDefaultTimeout(5000);

    await page.goto(getTestUrl("console"));

    await toggleProtocolMessages(page, false);
    await toggleProtocolMessage(page, "logs", true);
  });
}
