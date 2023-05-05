import { test } from "@playwright/test";

import { findKeyValues } from "replay-next/playwright/tests/utils/inspector";

import { beforeEach } from "./beforeEach";
import { verifyContextMenuCopy } from "./shared";

beforeEach();

test("should copy objects", async ({ page }) => {
  await verifyContextMenuCopy(page, findKeyValues, "filter_objectEmpty", "{}", "Copy object", "{}");

  await verifyContextMenuCopy(
    page,
    findKeyValues,
    "filter_objectSimple",
    '{foo: 123, bar: "abc", baz: true}',
    "Copy object",
    '{"foo": 123, "bar": "abc", "baz": true}'
  );
});
