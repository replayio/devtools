import { test } from "@playwright/test";

import { takeScreenshot } from "../utils/general";
import { addBreakPoint, getSourceLineLocator, removeBreakPoint } from "../utils/source";
import { beforeEach } from "./beforeEach";
import { sourceId } from "./shared";

beforeEach();

test("should support break points", async ({ page }) => {
  const sourceLine = getSourceLineLocator(page, sourceId, 13);
  await takeScreenshot(page, sourceLine, "source-line-no-breakpoint");
  await addBreakPoint(page, { sourceId, lineNumber: 13 });
  await takeScreenshot(page, sourceLine, "source-line-with-breakpoint");
  await removeBreakPoint(page, { sourceId, lineNumber: 13 });
  await takeScreenshot(page, sourceLine, "source-line-no-breakpoint");
});
