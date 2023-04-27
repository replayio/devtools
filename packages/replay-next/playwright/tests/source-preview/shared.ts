import { Page } from "@playwright/test";

import { takeScreenshot } from "../utils/general";

export function getSourcePreview(page: Page, partialText: string) {
  return page.locator("[data-test-name=SourcePreviewInspector]", { hasText: partialText });
}

export async function takeScreenshotHelper(page: Page, partialText: string, title: string) {
  const locator = getSourcePreview(page, partialText);
  await locator.scrollIntoViewIfNeeded();

  await takeScreenshot(page, locator, title);
}
