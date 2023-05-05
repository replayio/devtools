import { test } from "@playwright/test";

import { findKeyValues } from "replay-next/playwright/tests/utils/inspector";

import { beforeEach } from "./beforeEach";
import { verifyContextMenuCopy } from "./shared";

beforeEach();

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
