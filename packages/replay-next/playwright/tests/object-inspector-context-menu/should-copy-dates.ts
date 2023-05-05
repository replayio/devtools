import { test } from "@playwright/test";

import { findKeyValues } from "replay-next/playwright/tests/utils/inspector";

import { beforeEach } from "./beforeEach";
import { verifyContextMenuCopy } from "./shared";

beforeEach();

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
