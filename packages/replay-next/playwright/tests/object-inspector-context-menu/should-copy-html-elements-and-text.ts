import { test } from "@playwright/test";

import { findExpandables, findKeyValues } from "replay-next/playwright/tests/utils/inspector";

import { beforeEach } from "./beforeEach";
import { verifyContextMenuCopy } from "./shared";

beforeEach();

test("should copy html elements and text", async ({ page }, testInfo) => {
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
