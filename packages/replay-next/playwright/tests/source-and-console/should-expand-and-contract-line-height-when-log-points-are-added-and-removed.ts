import { test } from "@playwright/test";

import { takeScreenshot } from "../utils/general";
import {
  addConditional,
  addLogPoint,
  getSourceLineLocator,
  removeConditional,
  removeLogPoint,
} from "../utils/source";
import { beforeEach } from "./beforeEach";
import { sourceId } from "./shared";

beforeEach();

test("should expand and contract line height when log points are added and removed", async ({
  page,
}, testInfo) => {
  const lineLocator = getSourceLineLocator(page, sourceId, 13);
  await takeScreenshot(page, testInfo, lineLocator, "line-without-log-point");
  await addLogPoint(page, { sourceId, lineNumber: 13 });
  await takeScreenshot(page, testInfo, lineLocator, "line-with-log-point");
  await addConditional(page, {
    condition: "true",
    lineNumber: 13,
    saveAfterAdding: true,
    sourceId,
  });
  await takeScreenshot(page, testInfo, lineLocator, "line-with-conditional-log-point");
  await removeConditional(page, { lineNumber: 13, sourceId });
  await takeScreenshot(page, testInfo, lineLocator, "line-with-log-point");
  await removeLogPoint(page, { sourceId, lineNumber: 13 });
  await takeScreenshot(page, testInfo, lineLocator, "line-without-log-point");
});
