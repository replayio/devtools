import { test } from "@playwright/test";

import { toggleProtocolMessages, verifyConsoleMessage } from "../utils/console";
import { takeScreenshot } from "../utils/general";
import { addLogPoint, editLogPoint } from "../utils/source";
import { beforeEach } from "./beforeEach";
import { sourceId } from "./shared";

beforeEach();

test("should support conditional log points", async ({ page }, testInfo) => {
  await toggleProtocolMessages(page, false);
  await addLogPoint(page, { sourceId, lineNumber: 28 });

  const messages = page.locator("[data-test-name=Messages]");

  await editLogPoint(page, { sourceId, lineNumber: 28, content: `"logsToPrint", logsToPrint` });
  // wait for the logpoint messages to load
  await verifyConsoleMessage(page, "logsToPrint", "log-point", 8);
  await takeScreenshot(page, testInfo, messages, "log-point-multi-hits-console");

  await editLogPoint(page, {
    sourceId,
    lineNumber: 28,
    content: `"logsToPrint", logsToPrint`,
    condition: "logsToPrint <= 5",
  });
  // wait for the logpoint messages to load
  await verifyConsoleMessage(page, "logsToPrint", "log-point", 3);
  await takeScreenshot(page, testInfo, messages, "log-point-multi-hits-with-conditional-console");
});
