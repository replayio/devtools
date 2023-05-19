import { test } from "@playwright/test";

import { toggleProtocolMessages } from "../utils/console";
import { takeScreenshot } from "../utils/general";
import { addLogPoint, getPointPanelLocator } from "../utils/source";
import { beforeEach } from "./beforeEach";
import { sourceId } from "./shared";

beforeEach();

test("should overflow long log point text (without wrapping)", async ({ page }, testInfo) => {
  await toggleProtocolMessages(page, false);
  await addLogPoint(page, {
    sourceId,
    lineNumber: 13,
    content: '"This is a long string with a lot of text so that it overflows the log point panel"',
    saveAfterEdit: false,
  });
  const logPointPanel = getPointPanelLocator(page, 13);
  await takeScreenshot(
    page,
    testInfo,
    logPointPanel,
    "log-point-panel-with-long-text-in-edit-mode"
  );

  const saveButton = logPointPanel.locator('[data-test-name="PointPanel-SaveButton"]');
  await saveButton.click({ force: true });

  await takeScreenshot(
    page,
    testInfo,
    logPointPanel,
    "log-point-panel-with-long-text-in-read-only-mode"
  );
});
