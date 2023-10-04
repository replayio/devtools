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

import { beforeEach } from "./beforeEach";
import { verifyClipboardText, verifyContextMenuCopy } from "./shared";

beforeEach();

test("should copy deep arrays", async ({ page }, testInfo) => {
  // Verify that a deep array gets truncated correctly
  await verifyContextMenuCopy(
    page,
    findKeyValues,
    "deepArray",
    '["level-1", Array(2)]',
    "Copy array",
    '["level-1", ["level-2", ["level-3", ["level-4", ["level-5", ["[[ Truncated ]]", "[[ Truncated ]]"]]]]]]'
  );

  // Expand properties and copy the nested value
  for (let i = 1; i < 5; i++) {
    await toggleExpandable(page, { expanded: true, partialText: `level-${i}` });
  }

  const clientValues = await findClientValues(page, `level-5`);
  const clientValue = clientValues.last();

  await showContextMenu(page, clientValue);

  const contextMenuItem = await findContextMenuItem(page, "Copy array");
  await contextMenuItem.click();

  await verifyClipboardText(
    page,
    '["level-5", ["level-6", ["level-7", ["level-8", ["level-9", ["[[ Truncated ]]", "[[ Truncated ]]"]]]]]]'
  );
});
