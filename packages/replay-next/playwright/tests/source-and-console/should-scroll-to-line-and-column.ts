import { Page, TestInfo, test } from "@playwright/test";
import { SourceId } from "@replayio/protocol";

import { delay, takeScreenshot } from "../utils/general";
import { getSourceLineLocator, goToLine, openSourceFile } from "../utils/source";
import { beforeEach } from "./beforeEach";
import { sourceId } from "./shared";

beforeEach("350c08ae-c1ba-4043-8f23-8d71c897563d");

async function goToLineAndTakeScreenshot(
  page: Page,
  testInfo: TestInfo,
  options: {
    columnNumber?: number;
    lineNumber: number;
    sourceId: SourceId;
  }
) {
  const { columnNumber, lineNumber, sourceId } = options;

  await goToLine(page, sourceId, lineNumber, columnNumber);

  const lineLocator = getSourceLineLocator(page, sourceId, lineNumber);

  await takeScreenshot(
    page,
    testInfo,
    lineLocator,
    `go-to-line-${lineNumber}-column-${columnNumber}`
  );
}

test("should scroll to line and column", async ({ page }, testInfo) => {
  await openSourceFile(page, sourceId);

  // Verify jump-to-line
  await goToLineAndTakeScreenshot(page, testInfo, { lineNumber: 102, sourceId });
  await goToLineAndTakeScreenshot(page, testInfo, { lineNumber: 5, sourceId });

  // Verify jump-to-line-and-column
  await goToLineAndTakeScreenshot(page, testInfo, { lineNumber: 99, columnNumber: 260, sourceId });
  await goToLineAndTakeScreenshot(page, testInfo, { lineNumber: 98, columnNumber: 90, sourceId });
  await goToLineAndTakeScreenshot(page, testInfo, { lineNumber: 7, columnNumber: 0, sourceId });
});
