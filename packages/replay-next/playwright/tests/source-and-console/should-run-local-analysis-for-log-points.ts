import { test } from "@playwright/test";

import { toggleProtocolMessages, verifyConsoleMessage } from "../utils/console";
import { takeScreenshot } from "../utils/general";
import { addLogPoint } from "../utils/source";
import { beforeEach } from "./beforeEach";
import { sourceId } from "./shared";

beforeEach();

test("should run local analysis for log points", async ({ page }, testInfo) => {
  await toggleProtocolMessages(page, false);
  await addLogPoint(page, {
    sourceId,
    lineNumber: 13,
    content: '"local", 123, true',
  });
  await verifyConsoleMessage(page, "local 123 true", "log-point", 1);
  const message = page.locator("[data-test-name=Message]").first();
  await takeScreenshot(page, testInfo, message, "log-point-local-analysis");
});
