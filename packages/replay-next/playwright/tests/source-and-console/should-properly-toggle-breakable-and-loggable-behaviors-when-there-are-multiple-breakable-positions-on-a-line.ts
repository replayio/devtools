import { test } from "@playwright/test";

import { stopHovering, takeScreenshot } from "../utils/general";
import {
  addBreakPoint,
  addLogPoint,
  getSourceLineLocator,
  removeBreakPoint,
  removeLogPoint,
  toggleColumnBreakpoint,
} from "../utils/source";
import { beforeEach } from "./beforeEach";
import { sourceId } from "./shared";

beforeEach("da3ece0f-f987-4a9b-a188-85ed5a097674");

test("should properly toggle breakable and loggable behaviors when there are multiple breakable positions on a line", async ({
  page,
}) => {
  const lineNumber = 4;
  const lineLocator = getSourceLineLocator(page, sourceId, lineNumber);

  await addLogPoint(page, { lineNumber, sourceId });
  await stopHovering(page);
  await takeScreenshot(page, lineLocator, "line-4-column-19-should-log");

  await addBreakPoint(page, { lineNumber, sourceId });
  await stopHovering(page);
  await takeScreenshot(page, lineLocator, "line-4-column-19-should-log-and-break");

  await removeBreakPoint(page, { lineNumber, sourceId });
  await stopHovering(page);
  await takeScreenshot(page, lineLocator, "line-4-column-19-should-log");

  await toggleColumnBreakpoint(page, true, { columnIndex: 22, lineNumber, sourceId });
  await stopHovering(page);
  await takeScreenshot(page, lineLocator, "line-4-column-19-should-log-and-22-should-break");

  await addBreakPoint(page, { lineNumber, sourceId });
  await stopHovering(page);
  await takeScreenshot(
    page,
    lineLocator,
    "line-4-column-19-should-log-and-break-and-22-should-break"
  );

  await removeBreakPoint(page, { lineNumber, sourceId });
  await stopHovering(page);
  await takeScreenshot(page, lineLocator, "line-4-column-19-should-log-and-22-should-break");

  await removeLogPoint(page, { lineNumber, sourceId });
  await stopHovering(page);
  await takeScreenshot(page, lineLocator, "line-4-column-22-should-break");
});
