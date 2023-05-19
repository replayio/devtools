import { test } from "@playwright/test";

import { findKeyValues } from "replay-next/playwright/tests/utils/inspector";

import { beforeEach } from "./beforeEach";
import { verifyContextMenuCopy } from "./shared";

beforeEach();

test("should copy maps", async ({ page }, testInfo) => {
  await verifyContextMenuCopy(page, findKeyValues, "emptyMap", "Map(0)", "Copy map", "[]");

  await verifyContextMenuCopy(
    page,
    findKeyValues,
    "simpleMap",
    "Map(4)",
    "Copy map",
    '[["one", 1], ["two", "blah"], ["three", true], ["four", []]]'
  );

  await verifyContextMenuCopy(
    page,
    findKeyValues,
    "mapWithComplexKeys",
    "Map(4)",
    "Copy map",
    '[[{"foo": "bar"}, "object"], [[1, 2, 3], "array"], [[1, 2, 3], "Set"], [[["one", 123], ["two", true]], "map"]]'
  );
});
