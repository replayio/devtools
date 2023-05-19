import "../currentTestInfoWatcher";
import { test } from "@playwright/test";

import { toggleProtocolMessage, toggleProtocolMessages } from "../utils/console";
import { getTestUrl } from "../utils/general";
import testSetup from "../utils/testSetup";

export function beforeEach() {
  testSetup("ba2082dc-b69b-44dd-878f-e019e3f8a2dc");

  test.beforeEach(async ({ context, page }) => {
    page.setDefaultTimeout(5000);

    context.grantPermissions(["clipboard-read"]);

    await page.goto(getTestUrl("console"));

    await toggleProtocolMessages(page, false);
    await toggleProtocolMessage(page, "logs", true);
  });
}
