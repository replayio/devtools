import { test } from "@playwright/test";

import { findKeyValues } from "replay-next/playwright/tests/utils/inspector";

import { beforeEach } from "./beforeEach";
import { verifyContextMenuCopy } from "./shared";

beforeEach();

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
