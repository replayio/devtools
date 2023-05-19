import { expect, test } from "@playwright/test";

import {
  addTerminalExpression,
  locateMessage,
  seekToMessage,
  toggleProtocolMessage,
  toggleProtocolMessages,
} from "../utils/console";
import { getElementCount } from "../utils/general";
import { beforeEach } from "./beforeEach";
import { setup } from "./shared";

beforeEach();

test("should show a button to clear terminal expressions", async ({ page }, testInfo) => {
  await setup(page);

  await toggleProtocolMessage(page, "logs", true);

  const listItem = await locateMessage(page, "console-log", "This is a log");
  await seekToMessage(page, listItem);

  await toggleProtocolMessages(page, false);

  // Add some expressions
  await addTerminalExpression(page, "location.href");
  await addTerminalExpression(page, "+/local");

  await expect(await getElementCount(page, "[data-test-name=Message]")).toBe(2);
  await expect(await getElementCount(page, "[data-test-id=ClearConsoleEvaluationsButton]")).toBe(1);

  // Click the button to clear them
  await page.click("[data-test-id=ClearConsoleEvaluationsButton]");

  // Verify an empty terminal
  await expect(await getElementCount(page, "[data-test-name=Message]")).toBe(0);
  await expect(await getElementCount(page, "[data-test-id=ClearConsoleEvaluationsButton]")).toBe(0);
});
