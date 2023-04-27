import { test } from "@playwright/test";

import { takeScreenshot } from "../utils/general";
import { getSourceLocator, goToLine, openSourceFile } from "../utils/source";
import { beforeEach } from "./beforeEach";
import { sourceId } from "./shared";

beforeEach();

test("should support jumping to a line in the active source file", async ({ page }) => {
  await openSourceFile(page, sourceId);
  await goToLine(page, sourceId, 77);
  const sourceLocator = getSourceLocator(page, sourceId);
  await takeScreenshot(page, sourceLocator, "go-to-last-line");
  await goToLine(page, sourceId, 1);
  await takeScreenshot(page, sourceLocator, "go-to-first-line");
});
