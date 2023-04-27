import { test } from "@playwright/test";

import {
  findContextMenuItem,
  showContextMenu,
} from "replay-next/playwright/tests/utils/context-menu";
import {
  findClientValues,
  findKeyValues,
  toggleExpandable,
} from "replay-next/playwright/tests/utils/inspector";

import { locateMessage } from "../utils/console";
import { beforeEach } from "./beforeEach";
import { verifyClipboardText, verifyContextMenuCopy } from "./shared";

beforeEach();

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
