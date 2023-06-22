import { Page } from "@playwright/test";

import { toggleProtocolMessage, toggleProtocolMessages } from "../utils/console";
import { getTestUrl, waitForSession } from "../utils/general";

export async function setup(page: Page, toggleState: boolean | null = null) {
  await page.goto(getTestUrl("console"));

  await waitForSession(page);

  if (typeof toggleState === "boolean") {
    await toggleProtocolMessages(page, toggleState);
    await toggleProtocolMessage(page, "nodeModules", toggleState);
  }

  await toggleProtocolMessage(page, "timestamps", false);
}
