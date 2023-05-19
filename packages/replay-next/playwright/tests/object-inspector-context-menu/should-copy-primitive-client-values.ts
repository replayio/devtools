import { test } from "@playwright/test";

import { findClientValues } from "replay-next/playwright/tests/utils/inspector";

import { beforeEach } from "./beforeEach";
import { verifyContextMenuCopy } from "./shared";

beforeEach();

test("should copy primitive client values", async ({ page }, testInfo) => {
  await verifyContextMenuCopy(
    page,
    findClientValues,
    "string text",
    "text",
    "Copy string",
    '"text"'
  );
  await verifyContextMenuCopy(
    page,
    findClientValues,
    "booleanTrue true",
    "true",
    "Copy boolean",
    "true"
  );
  await verifyContextMenuCopy(
    page,
    findClientValues,
    "booleanFalse false",
    "false",
    "Copy boolean",
    "false"
  );
  await verifyContextMenuCopy(page, findClientValues, "number 123", "123", "Copy number", "123");
  await verifyContextMenuCopy(page, findClientValues, "numberNaN NaN", "NaN", "Copy number", "NaN");
  await verifyContextMenuCopy(
    page,
    findClientValues,
    "infinity Infinity",
    "Infinity",
    "Copy number",
    "Infinity"
  );
  await verifyContextMenuCopy(page, findClientValues, "bigInt 123n", "123n", "Copy bigint", "123n");
  await verifyContextMenuCopy(
    page,
    findClientValues,
    "symbol Symbol(example)",
    "Symbol(example)",
    "Copy symbol",
    '"Symbol(example)"'
  );
});
