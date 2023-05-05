import { expect, test } from "@playwright/test";

import { toggleProtocolMessages } from "../utils/console";
import { takeScreenshot, waitFor } from "../utils/general";
import {
  addLogPoint,
  editLogPoint,
  getPointPanelContentAutoCompleteListLocator,
  getPointPanelLocator,
  goToNextHitPoint,
} from "../utils/source";
import { beforeEach } from "./beforeEach";
import { sourceId } from "./shared";

beforeEach();

test("should auto-suggestion text based on the current expression", async ({ page }) => {
  await toggleProtocolMessages(page, false);
  await addLogPoint(page, { sourceId, lineNumber: 28 });

  // Select a pause and frame so auto-complete will work.
  await goToNextHitPoint(page, 28);

  await editLogPoint(page, { sourceId, lineNumber: 28, content: "win", saveAfterEdit: false });

  const autoCompleteList = getPointPanelContentAutoCompleteListLocator(page, 28);
  await waitFor(async () => expect(await autoCompleteList.isVisible()).toBe(true));
  await takeScreenshot(page, autoCompleteList, "log-point-auto-complete-list-window");

  // Select the 1st suggestion in the list: window
  await page.keyboard.press("Enter");
  const pointPanelLocator = getPointPanelLocator(page, 28);
  await takeScreenshot(page, pointPanelLocator, "log-point-auto-complete-text-window");

  await editLogPoint(page, {
    sourceId,
    lineNumber: 28,
    content: "window.locat",
    saveAfterEdit: false,
  });
  await waitFor(async () => expect(await autoCompleteList.isVisible()).toBe(true));
  await takeScreenshot(page, autoCompleteList, "log-point-auto-complete-list-window.loc");

  // Select the 1st suggestion in the list: location
  await page.keyboard.press("Enter");
  await takeScreenshot(page, pointPanelLocator, "log-point-auto-complete-text-window.location");
});
