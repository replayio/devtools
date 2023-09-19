import { test } from "@playwright/test";

import { takeScreenshot } from "../utils/general";
import {
  addConditional,
  addLogPoint,
  getSourceLineLocator,
  removeConditional,
  removeLogPoint,
  waitForLogpointResults,
} from "../utils/source";
import { beforeEach } from "./beforeEach";
import { sourceId } from "./shared";

beforeEach();

test("should expand and contract line height when log points are added and removed", async ({
  page,
}, testInfo) => {
  const lineNumber = 13;
  const lineLocator = getSourceLineLocator(page, sourceId, lineNumber);
  await takeScreenshot(page, testInfo, lineLocator, "line-without-log-point");
  await addLogPoint(page, { sourceId, lineNumber });
  await waitForLogpointResults(page, sourceId, lineNumber);
  await takeScreenshot(page, testInfo, lineLocator, "line-with-log-point");
  await addConditional(page, {
    condition: "true",
    lineNumber,
    saveAfterAdding: true,
    sourceId,
  });
  await waitForLogpointResults(page, sourceId, lineNumber);
  await takeScreenshot(page, testInfo, lineLocator, "line-with-conditional-log-point");
  await removeConditional(page, { lineNumber, sourceId });
  await takeScreenshot(page, testInfo, lineLocator, "line-with-log-point");
  await removeLogPoint(page, { sourceId, lineNumber });
  await takeScreenshot(page, testInfo, lineLocator, "line-without-log-point");
});
