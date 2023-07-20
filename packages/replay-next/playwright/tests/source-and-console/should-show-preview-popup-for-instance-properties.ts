import { test } from "@playwright/test";

import { continueTo, showPreview } from "../utils/source";
import { beforeEach } from "./beforeEach";
import { sourceId } from "./shared";

beforeEach();

test("should show preview popup for instance properties", async ({ page }, testInfo) => {
  await continueTo(page, { direction: "next", lineNumber: 79, sourceId, use: "hover-button" });

  // Hover over `this`
  await showPreview(page, { columnNumber: 11, lineNumber: 78, partialText: "Example", sourceId });

  // Hover over `this.array`
  await showPreview(page, { columnNumber: 16, lineNumber: 78, partialText: "Array(3)", sourceId });
});
