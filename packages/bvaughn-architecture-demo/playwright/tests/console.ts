import { test, expect } from "@playwright/test";

import { takeScreenshot } from "./utils/general";

const URL = "http://172.17.0.1:3000/tests/console/basic";

test("should display list of messages", async ({ page }) => {
  await page.goto(URL);
  const list = page.locator('[data-test-id="Messages"]');
  await expect(list).toContainText("This is a log");
  await expect(list).toContainText("This is a warning");
  await expect(list).toContainText("This is an error");
});

test("should display toggleable stack for errors", async ({ page }) => {
  await page.goto(URL);

  const listItem = page.locator('[data-test-id="Message"]', { hasText: "This is an error" });
  await takeScreenshot(page, listItem, "error-stack-collapsed");

  const toggle = page.locator("[role=button]", { hasText: "This is an error" });
  await toggle.click();
  await takeScreenshot(page, listItem, "error-stack-expanded");
});

test("should display toggleable stack for warnings", async ({ page }) => {
  await page.goto(URL);

  const listItem = page.locator('[data-test-id="Message"]', { hasText: "This is a warning" });
  await takeScreenshot(page, listItem, "warning-stack-collapsed");

  const toggle = page.locator("[role=button]", { hasText: "This is a warning" });
  await toggle.click();
  await takeScreenshot(page, listItem, "warning-stack-expanded");
});

test("should display toggleable stack for traces", async ({ page }) => {
  await page.goto(URL);

  const listItem = page.locator('[data-test-id="Message"]', { hasText: "This is a trace" });
  await takeScreenshot(page, listItem, "trace-stack-collapsed");

  const toggle = page.locator("[role=button]", { hasText: "This is a trace" });
  await toggle.click();
  await takeScreenshot(page, listItem, "trace-stack-expanded");
});

test("should expand and inspect arrays", async ({ page }) => {
  await page.goto(URL);

  const listItem = page.locator('[data-test-id="Expandable"]', { hasText: "This is a warning" });
  await takeScreenshot(page, listItem, "array-collapsed");

  const keyValue = listItem.locator("[data-test-id=Expandable]", { hasText: "Array" });
  await keyValue.click();
  await takeScreenshot(page, listItem, "array-expanded");
});

test("should expand and inspect objects", async ({ page }) => {
  await page.goto(URL);

  const listItem = page.locator('[data-test-id="Expandable"]', { hasText: "This is an error" });
  await takeScreenshot(page, listItem, "object-collapsed");

  const keyValue = listItem.locator("[data-test-id=Expandable]", { hasText: "foo" });
  await keyValue.click();
  await takeScreenshot(page, listItem, "object-expanded");

  const children = listItem.locator("[data-test-id=ExpandableChildren]");
  const nestedKeyValue = children.locator("[data-test-id=Expandable]", { hasText: "foo" });
  await nestedKeyValue.click();
  await takeScreenshot(page, listItem, "nested-object-expanded");
});
