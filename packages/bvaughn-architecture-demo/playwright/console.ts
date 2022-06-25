import { test, expect } from "@playwright/test";

const URL = "http://localhost:3000/tests/console/basic";

test("should display list of messages", async ({ page }) => {
  await page.goto(URL);
  const list = page.locator('[data-test-id="Messages"]');
  await expect(list).toContainText("This is a log");
  await expect(list).toContainText("This is a warning");
  await expect(list).toContainText("This is an error");
});
