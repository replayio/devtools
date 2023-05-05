import { test } from "@playwright/test";

import { findKeyValues } from "replay-next/playwright/tests/utils/inspector";

import { beforeEach } from "./beforeEach";
import { verifyContextMenuCopy } from "./shared";

beforeEach();

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
