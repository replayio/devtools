import { Page, test } from "@playwright/test";

import { getBaseURL, getURLFlags, takeScreenshot } from "./utils/general";
import testSetup from "./utils/testSetup";

const URL = `${getBaseURL()}/tests/object-inspector?${getURLFlags()}`;

async function filterByText(page: Page, text: string) {
  await page.fill("[data-test-id=ConsoleFilterInput]", text);
}

async function inspectAndTakeScreenshotOf(page: Page, partialText: string, screenshotName: string) {
  const messageItem = await page
    .locator("[data-test-name=Message]", { hasText: partialText })
    .first();

  const keyValue = messageItem.locator("[data-test-name=Expandable]").first();
  await keyValue.click();

  await takeScreenshot(page, keyValue, screenshotName);
}

async function takeScreenshotOfMessage(page: Page, partialText: string, screenshotName: string) {
  const messageItem = await page
    .locator("[data-test-name=Message]", { hasText: partialText })
    .first();

  await takeScreenshot(page, messageItem, screenshotName);
}

async function takeScreenshotOfMessages(page: Page, screenshotName: string) {
  const messageItem = await page.locator("[data-test-name=Messages]").first();

  await takeScreenshot(page, messageItem, screenshotName);
}

testSetup(async function regeneratorFunction({ page }) {
  await page.goto(URL);

  await inspectAndTakeScreenshotOf(page, "arrayLength", "render-and-inspect-array");
  await inspectAndTakeScreenshotOf(page, "bigUint64Array", "render-and-inspect-big-uint-64-array");
  await inspectAndTakeScreenshotOf(page, "regularFunction", "render-and-inspect-function");
  await inspectAndTakeScreenshotOf(
    page,
    "htmlElementWithChildren",
    "render-and-inspect-html-element"
  );
  await inspectAndTakeScreenshotOf(page, "simpleMap", "render-and-inspect-map");
  await inspectAndTakeScreenshotOf(page, "regex", "render-and-inspect-regex");
  await inspectAndTakeScreenshotOf(page, "simpleSet", "render-and-inspect-set");
  await inspectAndTakeScreenshotOf(page, "objectSimple", "render-and-inspect-object");
  await inspectAndTakeScreenshotOf(
    page,
    "mapWithFalsyKeys",
    "render-and-inspect-map-with-falsy-keys"
  );
  await inspectAndTakeScreenshotOf(
    page,
    "mapWithComplexKeys",
    "render-and-inspect-map-with-complex-keys"
  );
});

test("should render simple values", async ({ page }) => {
  await page.goto(URL);

  await takeScreenshotOfMessage(page, "specialNull", "render-null");
  await takeScreenshotOfMessage(page, "specialUndefined", "render-undefined");

  await takeScreenshotOfMessage(page, "string", "render-string");

  await takeScreenshotOfMessage(page, "booleanFalse", "render-false");
  await takeScreenshotOfMessage(page, "booleanTrue", "render-true");

  await takeScreenshotOfMessage(page, "number", "render-number");
  await takeScreenshotOfMessage(page, "NaN", "render-nan");
  await takeScreenshotOfMessage(page, "infinity", "render-infinity");
  await takeScreenshotOfMessage(page, "bigInt", "render-bigInt");

  await takeScreenshotOfMessage(page, "symbol", "render-symbol");
});

test("should render and inspect arrays", async ({ page }) => {
  await page.goto(URL);

  filterByText(page, "array");

  await takeScreenshotOfMessages(page, "render-arrays");
  await inspectAndTakeScreenshotOf(page, "arrayLength", "render-and-inspect-array");
  await inspectAndTakeScreenshotOf(page, "bigUint64Array", "render-and-inspect-big-uint-64-array");
});

test("should render dates", async ({ page }) => {
  await page.goto(URL);

  filterByText(page, "date");

  await takeScreenshotOfMessages(page, "render-dates");
});

test("should render errors", async ({ page }) => {
  await page.goto(URL);

  filterByText(page, "error");

  await takeScreenshotOfMessages(page, "render-errors");
});

test("should render and inspect functions", async ({ page }) => {
  await page.goto(URL);

  filterByText(page, "function");

  await takeScreenshotOfMessages(page, "render-functions");
  await inspectAndTakeScreenshotOf(page, "regularFunction", "render-and-inspect-function");
});

test("should render and inspect HTML elements", async ({ page }) => {
  await page.goto(URL);

  filterByText(page, "filter_html");

  await takeScreenshotOfMessages(page, "render-html-elements-and-texts");
  await inspectAndTakeScreenshotOf(
    page,
    "htmlElementWithChildren",
    "render-and-inspect-html-element"
  );
});

test("should render and inspect maps", async ({ page }) => {
  await page.goto(URL);

  filterByText(page, "map");

  await takeScreenshotOfMessages(page, "render-empty-maps");
  await inspectAndTakeScreenshotOf(page, "simpleMap", "render-and-inspect-map");
  await inspectAndTakeScreenshotOf(
    page,
    "mapWithFalsyKeys",
    "render-and-inspect-map-with-falsy-keys"
  );
  await inspectAndTakeScreenshotOf(
    page,
    "mapWithComplexKeys",
    "render-and-inspect-map-with-complex-keys"
  );
});

test("should render and inspect regular expressions", async ({ page }) => {
  await page.goto(URL);

  filterByText(page, "regex");

  await takeScreenshotOfMessages(page, "render-regular-expressions");
  await inspectAndTakeScreenshotOf(page, "regex", "render-and-inspect-regex");
});

test("should render and inspect sets", async ({ page }) => {
  await page.goto(URL);

  filterByText(page, "set");

  await takeScreenshotOfMessages(page, "render-empty-sets");
  await inspectAndTakeScreenshotOf(page, "simpleSet", "render-and-inspect-set");
});

test("should render and inspect objects", async ({ page }) => {
  await page.goto(URL);

  filterByText(page, "filter_object");

  await takeScreenshotOfMessages(page, "render-empty-objects");
  await inspectAndTakeScreenshotOf(page, "objectSimple", "render-and-inspect-object");
});
