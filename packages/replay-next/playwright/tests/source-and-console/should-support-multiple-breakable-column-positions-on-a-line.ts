import { test } from "@playwright/test";

import { stopHovering, takeScreenshot } from "../utils/general";
import {
  addBreakPoint,
  getSourceLineLocator,
  removeBreakPoint,
  toggleColumnBreakpoint,
} from "../utils/source";
import { beforeEach } from "./beforeEach";
import { sourceId } from "./shared";

beforeEach("da3ece0f-f987-4a9b-a188-85ed5a097674");

test("should support multiple breakable column positions on a line", async ({ page }) => {
  const lineNumber = 4;
  const lineLocator = getSourceLineLocator(page, sourceId, lineNumber);

  await takeScreenshot(page, lineLocator, "line-4-no-breakpoints-enabled");

  await addBreakPoint(page, { lineNumber, sourceId });
  await stopHovering(page);
  await takeScreenshot(page, lineLocator, "line-4-break-on-column-19");

  await toggleColumnBreakpoint(page, true, { columnIndex: 22, lineNumber, sourceId });
  await stopHovering(page);
  await takeScreenshot(page, lineLocator, "line-4-break-on-columns-19-and-22");

  await toggleColumnBreakpoint(page, false, { columnIndex: 22, lineNumber, sourceId });
  await stopHovering(page);
  await takeScreenshot(page, lineLocator, "line-4-break-on-column-19");

  await toggleColumnBreakpoint(page, true, { columnIndex: 30, lineNumber, sourceId });
  await stopHovering(page);
  await takeScreenshot(page, lineLocator, "line-4-break-on-columns-19-and-30");

  await removeBreakPoint(page, { lineNumber, sourceId });
  await stopHovering(page);
  await takeScreenshot(page, lineLocator, "line-4-no-breakpoints-enabled");
});
