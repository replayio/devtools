import { test } from "@playwright/test";

import { findKeyValues } from "replay-next/playwright/tests/utils/inspector";

import { beforeEach } from "./beforeEach";
import { verifyContextMenuCopy } from "./shared";

beforeEach();

test("should copy arrays", async ({ page }, testInfo) => {
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
    "[{…}, Array(2)]",
    "Copy array",
    '[{"foo": 123, "bar": "abc"}, [1, 2]]'
  );
});
