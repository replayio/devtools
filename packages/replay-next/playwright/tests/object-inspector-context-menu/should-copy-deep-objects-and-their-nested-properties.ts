import { test } from "@playwright/test";

import {
  findContextMenuItem,
  showContextMenu,
} from "replay-next/playwright/tests/utils/context-menu";
import { findKeyValues, toggleExpandable } from "replay-next/playwright/tests/utils/inspector";

import { locateMessage } from "../utils/console";
import { beforeEach } from "./beforeEach";
import { verifyClipboardText, verifyContextMenuCopy } from "./shared";

beforeEach();

test("should copy deep objects and their nested properties", async ({ page }, testInfo) => {
  // Verify that a deep object gets truncated correctly
  await verifyContextMenuCopy(
    page,
    findKeyValues,
    "filter_objectDeep",
    "level-1",
    "Copy object",
    '{"level-1": {"level-2": {"level-3": {"level-4": {"level-5": {"level-6": "[[ Truncated ]]"}}}}}}'
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
