import { test } from "@playwright/test";

import { filterByText } from "../utils/console";
import { beforeEach } from "./beforeEach";
import { inspectAndTakeScreenshotOf, takeScreenshotOfMessages } from "./shared";

beforeEach();

test("should render and inspect HTML elements", async ({ page }) => {
  await filterByText(page, "filter_html");

  await takeScreenshotOfMessages(page, "render-html-elements-and-texts");
  await inspectAndTakeScreenshotOf(
    page,
    "htmlElementWithChildren",
    "render-and-inspect-html-element"
  );
});
