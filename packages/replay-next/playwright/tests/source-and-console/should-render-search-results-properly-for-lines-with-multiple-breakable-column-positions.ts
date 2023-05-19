import { test } from "@playwright/test";

import { stopHovering, takeScreenshot } from "../utils/general";
import {
  addBreakPoint,
  getSourceLineLocator,
  removeBreakPoint,
  searchSourceText,
} from "../utils/source";
import { beforeEach } from "./beforeEach";
import { sourceId } from "./shared";

beforeEach("da3ece0f-f987-4a9b-a188-85ed5a097674");

test("should render search results properly for lines with multiple breakable column positions", async ({
  page,
}, testInfo) => {
  const lineNumber = 4;
  const lineLocator = getSourceLineLocator(page, sourceId, lineNumber);

  // Search result includes a breakpoint marker
  await searchSourceText(page, "i = 0");
  await takeScreenshot(page, testInfo, lineLocator, "line-4-search-result-one-no-breakpoints");
  await addBreakPoint(page, { lineNumber, sourceId });
  await stopHovering(page);
  await takeScreenshot(page, testInfo, lineLocator, "line-4-search-result-one-with-breakpoints");

  // Search result includes multiple breakpoint markers
  await searchSourceText(page, "= 0; i");
  await takeScreenshot(page, testInfo, lineLocator, "line-4-search-result-two-with-breakpoints");

  // Multiple search results per line
  await searchSourceText(page, "0;");
  await takeScreenshot(page, testInfo, lineLocator, "line-4-search-result-three-with-breakpoints");
  await removeBreakPoint(page, { lineNumber, sourceId });
  await stopHovering(page);
  await takeScreenshot(page, testInfo, lineLocator, "line-4-search-result-three-no-breakpoints");
});
