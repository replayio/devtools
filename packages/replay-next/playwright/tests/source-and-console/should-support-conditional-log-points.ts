import { test } from "@playwright/test";

import { toggleProtocolMessages } from "../utils/console";
import { takeScreenshot } from "../utils/general";
import { addLogPoint, editLogPoint } from "../utils/source";
import { beforeEach } from "./beforeEach";
import { sourceId } from "./shared";

beforeEach();

test("should support conditional log points", async ({ page }) => {
  await toggleProtocolMessages(page, false);
  await addLogPoint(page, { sourceId, lineNumber: 28 });

  const messages = page.locator("[data-test-name=Messages]");

  await editLogPoint(page, { sourceId, lineNumber: 28, content: `"logsToPrint", logsToPrint` });
  await takeScreenshot(page, messages, "log-point-multi-hits-console");

  await editLogPoint(page, {
    sourceId,
    lineNumber: 28,
    content: `"logsToPrint", logsToPrint`,
    condition: "logsToPrint <= 5",
  });
  await takeScreenshot(page, messages, "log-point-multi-hits-with-conditional-console");
});
