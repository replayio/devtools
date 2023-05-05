import { test } from "@playwright/test";

import { takeScreenshot } from "../utils/general";
import { addBreakPoint, addLogPoint, getSourceLineLocator, removeLogPoint } from "../utils/source";
import { beforeEach } from "./beforeEach";
import { sourceId } from "./shared";

beforeEach();

test("should not erase break point when logging is toggled", async ({ page }) => {
  const sourceLine = getSourceLineLocator(page, sourceId, 13);
  await addBreakPoint(page, { sourceId, lineNumber: 13 });
  await addLogPoint(page, { sourceId, lineNumber: 13 });
  await takeScreenshot(page, sourceLine, "source-line-with-break-point-and-log-point-content");
  await removeLogPoint(page, { sourceId, lineNumber: 13 });
  await takeScreenshot(page, sourceLine, "source-line-with-break-point-only-content");
});
