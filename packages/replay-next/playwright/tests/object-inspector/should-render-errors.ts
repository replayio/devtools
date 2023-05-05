import { test } from "@playwright/test";

import { filterByText } from "../utils/console";
import { beforeEach } from "./beforeEach";
import { takeScreenshotOfMessages } from "./shared";

beforeEach();

test("should render errors", async ({ page }) => {
  await filterByText(page, "error");

  await takeScreenshotOfMessages(page, "render-errors");
});
