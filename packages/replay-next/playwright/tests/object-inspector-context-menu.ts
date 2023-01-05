import { Locator, Page, expect, test } from "@playwright/test";

import {
  findContextMenuItem,
  showContextMenu,
} from "replay-next/playwright/tests/utils/context-menu";
import {
  findClientValues,
  findExpandables,
  findKeyValues,
} from "replay-next/playwright/tests/utils/inspector";

import {
  filterByText,
  locateMessage,
  toggleProtocolMessage,
  toggleProtocolMessages,
} from "./utils/console";
import { getTestUrl, waitFor } from "./utils/general";
import testSetup from "./utils/testSetup";

import { readSync, writeSync } from "clipboardy";

testSetup("ee4da15f-5d86-4629-8356-c673b5e711b0");

type LocatorFunction = (
  page: Page,
  partialText: string,
  locator: Locator | null
) => Promise<Locator>;

async function verifyContextMenuCopy(
  page: Page,
  locatorFunction: LocatorFunction,
  filterText: string,
  inspectorText: string,
  copyLabel: string,
  expectedValue: string
): Promise<void> {
  await filterByText(page, filterText);

  const listItems = await locateMessage(page, "console-log", filterText);
  const listItem = listItems.first();

  const inspectorItems = await locatorFunction(page, inspectorText, listItem);
  const inspectorItem = inspectorItems.last();

  await showContextMenu(page, inspectorItem);

  writeSync(""); // clear clipboard

  const contextMenuItem = await findContextMenuItem(page, copyLabel);
  await contextMenuItem.click();

  await waitFor(async () => {
    const actualValue = readSync();
    if (actualValue !== expectedValue) {
      throw `Expected clipboard to contain "${expectedValue}" but found "${actualValue}"`;
    }
  });
}

test.beforeEach(async ({ page }) => {
  page.setDefaultTimeout(5000);

  await page.goto(getTestUrl("console"));

  await toggleProtocolMessages(page, false);
  await toggleProtocolMessage(page, "logs", true);
});

test("should copy primitive client values", async ({ page }) => {
  await verifyContextMenuCopy(
    page,
    findClientValues,
    "string text",
    "text",
    "Copy string",
    '"text"'
  );
  await verifyContextMenuCopy(
    page,
    findClientValues,
    "booleanTrue true",
    "true",
    "Copy boolean",
    "true"
  );
  await verifyContextMenuCopy(
    page,
    findClientValues,
    "booleanFalse false",
    "false",
    "Copy boolean",
    "false"
  );
  await verifyContextMenuCopy(page, findClientValues, "number 123", "123", "Copy number", "123");
  await verifyContextMenuCopy(page, findClientValues, "numberNaN NaN", "NaN", "Copy number", "NaN");
  await verifyContextMenuCopy(
    page,
    findClientValues,
    "infinity Infinity",
    "Infinity",
    "Copy number",
    "Infinity"
  );
  await verifyContextMenuCopy(page, findClientValues, "bigInt 123n", "123n", "Copy bigint", "123n");
  await verifyContextMenuCopy(
    page,
    findClientValues,
    "symbol Symbol(example)",
    "Symbol(example)",
    "Copy symbol",
    '"Symbol(example)"'
  );
});

test("should copy dates", async ({ page }) => {
  await verifyContextMenuCopy(
    page,
    findKeyValues,
    "date",
    "Mon Aug 29 2022",
    "Copy date",
    '"Mon Aug 29 2022 14:42:16 GMT-0400 (Eastern Daylight Time)"'
  );
});

test("should copy errors", async ({ page }) => {
  await verifyContextMenuCopy(
    page,
    findKeyValues,
    "error Error",
    "Error: This is an error",
    "Copy error",
    '"Error: This is an error"'
  );
});

test("should copy regular expressions", async ({ page }) => {
  await verifyContextMenuCopy(
    page,
    findKeyValues,
    "regex /abc[123]+/i",
    "/abc[123]+/i",
    "Copy regex",
    "/abc[123]+/i"
  );
});

test("should copy functions", async ({ page }) => {
  await verifyContextMenuCopy(
    page,
    findKeyValues,
    "regularFunction",
    "regularFunction",
    "Copy function",
    '"regularFunction() {}"'
  );

  await verifyContextMenuCopy(
    page,
    findKeyValues,
    "overflowingFunction",
    "overflowingFunction",
    "Copy function",
    '"overflowingFunction(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t, u, v, w, x, y, z) {}"'
  );
});

test("should copy arrays", async ({ page }) => {
  await verifyContextMenuCopy(page, findKeyValues, "emptyArray", "[]", "Copy array", "[]");

  await verifyContextMenuCopy(
    page,
    findKeyValues,
    "arrayLength4",
    "[1, 2, 3, 4]",
    "Copy array",
    "[1, 2, 3, 4]"
  );

  await verifyContextMenuCopy(
    page,
    findKeyValues,
    "arrayWithObjects",
    "[{…}, Array]",
    "Copy array",
    '[{"foo": 123, "bar": "abc"}, [1, 2]]'
  );
});

test("should copy objects", async ({ page }) => {
  await verifyContextMenuCopy(page, findKeyValues, "filter_objectEmpty", "{}", "Copy object", "{}");

  await verifyContextMenuCopy(
    page,
    findKeyValues,
    "filter_objectSimple",
    '{foo: 123, bar: "abc", baz: true}',
    "Copy object",
    '{"foo": 123, "bar": "abc", "baz": true}'
  );
});

test("should copy maps", async ({ page }) => {
  await verifyContextMenuCopy(page, findKeyValues, "emptyMap", "Map(0)", "Copy map", "[]");

  await verifyContextMenuCopy(
    page,
    findKeyValues,
    "simpleMap",
    "Map(4)",
    "Copy map",
    '[["one", 1], ["two", "blah"], ["three", true], ["four", []]]'
  );

  await verifyContextMenuCopy(
    page,
    findKeyValues,
    "mapWithComplexKeys",
    "Map(4)",
    "Copy map",
    '[[{"foo": "bar"}, "object"], [[1, 2, 3], "array"], [[1, 2, 3], "Set"], [[["one", 123], ["two", true]], "map"]]'
  );
});

test("should copy sets", async ({ page }) => {
  await verifyContextMenuCopy(page, findKeyValues, "emptySet", "Set(0)", "Copy set", "[]");

  await verifyContextMenuCopy(
    page,
    findKeyValues,
    "simpleSet",
    "Set(4)",
    "Copy set",
    '[1, "two", true, []]'
  );
});

test("should copy html elements and text", async ({ page }) => {
  await verifyContextMenuCopy(
    page,
    findKeyValues,
    "filter_htmlElement",
    "<div",
    "Copy html-element",
    "<div />"
  );

  await verifyContextMenuCopy(
    page,
    findKeyValues,
    "filter_htmlElementWithAttributes",
    "<button",
    "Copy html-element",
    '<button name="loginButton" disabled="true">Login</button>'
  );

  await verifyContextMenuCopy(
    page,
    findExpandables,
    "filter_htmlElementWithChildren",
    "<ul",
    "Copy html-element",
    '<ul><li class="Header" style="background-color: yellow; color: black;">First item</li> <li><div>Second item</div> Text node</li> <li /></ul>'
  );

  await verifyContextMenuCopy(
    page,
    findKeyValues,
    "filter_htmlText",
    "Text node",
    "Copy html-text",
    "Text node"
  );
});
