import { test } from "@playwright/test";

import {
  locateMessage,
  seekToMessage,
  toggleProtocolMessage,
  verifyTypeAheadContainsSuggestions,
} from "../utils/console";
import { delay } from "../utils/general";
import { beforeEach } from "./beforeEach";
import { setup } from "./shared";

beforeEach();

test("should add true/false keywords to the list of suggestions", async ({ page }) => {
  await setup(page);
  await toggleProtocolMessage(page, "logs", true);

  const listItem = await locateMessage(page, "console-log", "This is a log");
  await seekToMessage(page, listItem);

  await delay(100);

  await page.fill("[data-test-id=ConsoleTerminalInput]", "tr");
  await verifyTypeAheadContainsSuggestions(page, "thisisgonnafail");

  await page.fill("[data-test-id=ConsoleTerminalInput]", "fa");
  await verifyTypeAheadContainsSuggestions(page, "false");
});
