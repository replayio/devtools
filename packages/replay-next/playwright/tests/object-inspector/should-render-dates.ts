import { test } from "@playwright/test";

import { filterByText } from "../utils/console";
import { beforeEach } from "./beforeEach";
import { takeScreenshotOfMessages } from "./shared";

beforeEach();

test("should render dates", async ({ page }) => {
  await filterByText(page, "date");

  await takeScreenshotOfMessages(page, "render-dates");
});
