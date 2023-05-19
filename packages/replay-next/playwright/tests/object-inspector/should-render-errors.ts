import { test } from "@playwright/test";

import { filterByText } from "../utils/console";
import { beforeEach } from "./beforeEach";
import { takeScreenshotOfMessages } from "./shared";

beforeEach();

test("should render errors", async ({ page }, testInfo) => {
  await filterByText(page, "error");

  await takeScreenshotOfMessages(page, testInfo, "render-errors");
});
