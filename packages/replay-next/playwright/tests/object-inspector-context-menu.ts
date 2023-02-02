import { Locator, Page, test } from "@playwright/test";

import {
  findContextMenuItem,
  showContextMenu,
} from "replay-next/playwright/tests/utils/context-menu";
import {
  findClientValues,
  findExpandables,
  findKeyValues,
  toggleExpandable,
} from "replay-next/playwright/tests/utils/inspector";

import {
  filterByText,
  locateMessage,
  toggleProtocolMessage,
  toggleProtocolMessages,
} from "./utils/console";
import { getTestUrl, waitFor } from "./utils/general";
import testSetup from "./utils/testSetup";

testSetup("ba2082dc-b69b-44dd-878f-e019e3f8a2dc");

type LocatorFunction = (
  page: Page,
  partialText: string,
  locator: Locator | null
) => Promise<Locator>;

async function verifyClipboardText(page: Page, expectedValue: string): Promise<void> {
  await waitFor(async () => {
    const actualText = await page.evaluate(() => navigator.clipboard.readText());
    if (actualText !== expectedValue) {
      throw `Expected clipboard to contain "${expectedValue}" but found "${actualText}"`;
    }
  });
}

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

  const contextMenuItem = await findContextMenuItem(page, copyLabel);
  await contextMenuItem.click();

  await verifyClipboardText(page, expectedValue);
}

test.beforeEach(async ({ context, page }) => {
  page.setDefaultTimeout(5000);

  context.grantPermissions(["clipboard-read"]);

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
    "2023",
    "Copy date",
    '"2023-01-26T15:24:05.181Z"'
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

test("should copy deep arrays and their nested properties", async ({ page }) => {
  // Verify a deep object that gets truncated
  await verifyContextMenuCopy(
    page,
    findKeyValues,
    "deepArray",
    "(2) [",
    "Copy array",
    '["level-1", ["level-2", ["level-3", ["level-4", ["level-5", ["[[ Truncated ]]", "[[ Truncated ]]"]]]]]]'
  );

  // Expand properties and copy the nested value
  const listItems = await locateMessage(page, "console-log", "level-1");
  const listItem = listItems.first();
  for (let i = 1; i <= 5; i++) {
    await toggleExpandable(page, { expanded: true, partialText: `level-${i}` });
  }

  const clientValues = await findClientValues(page, `level-6`);
  const clientValue = clientValues.last();

  await showContextMenu(page, clientValue);

  const contextMenuItem = await findContextMenuItem(page, "Copy array");
  await contextMenuItem.click();

  const expectedValue = '["level-6", ["level-7", ["level-8", ["level-9", ["level-10", []]]]]]';
  await verifyClipboardText(page, expectedValue);
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

test("should copy deep objects and their nested properties", async ({ page }) => {
  // Verify a deep object that gets truncated
  await verifyContextMenuCopy(
    page,
    findKeyValues,
    "filter_objectDeep",
    "level-1",
    "Copy object",
    '{"level-1": {"level-2": {"level-3": {"level-4": {"level-5": {"[[ Truncated ]]"}}}}}}'
  );

  // Expand properties and copy the nested value
  const listItems = await locateMessage(page, "console-log", "level-1");
  const listItem = listItems.first();
  for (let i = 1; i <= 5; i++) {
    await toggleExpandable(page, { expanded: true, partialText: `level-${i}: {…}` });
  }

  const keyValues = await findKeyValues(page, `level-5`, listItem);
  const keyValue = keyValues.last();

  await showContextMenu(page, keyValue);

  const contextMenuItem = await findContextMenuItem(page, "Copy object");
  await contextMenuItem.click();

  const expectedValue = '{"level-6": {"level-7": {"level-8": {"level-9": {"level-10": {}}}}}}';
  await verifyClipboardText(page, expectedValue);
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
