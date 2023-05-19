import { test } from "@playwright/test";

import { filterByText } from "../utils/console";
import { beforeEach } from "./beforeEach";
import { inspectAndTakeScreenshotOf, takeScreenshotOfMessages } from "./shared";

beforeEach();

test("should render and inspect HTML elements", async ({ page }, testInfo) => {
  await filterByText(page, "filter_html");

  await takeScreenshotOfMessages(page, testInfo, "render-html-elements-and-texts");
  await inspectAndTakeScreenshotOf(
    page,
    testInfo,
    "htmlElementWithChildren",
    "render-and-inspect-html-element"
  );
});
