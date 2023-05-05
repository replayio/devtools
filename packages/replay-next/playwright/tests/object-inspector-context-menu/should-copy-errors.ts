import { test } from "@playwright/test";

import { findKeyValues } from "replay-next/playwright/tests/utils/inspector";

import { beforeEach } from "./beforeEach";
import { verifyContextMenuCopy } from "./shared";

beforeEach();

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
