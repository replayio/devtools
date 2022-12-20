import test from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import {
  executeTerminalExpression,
  verifyConsoleMessage,
  warpToMessage,
} from "../helpers/console-panel";

const url = "doc_prod_bundle.html";

test(`object_preview-05: Should support logging objects as values`, async ({ page }) => {
  await startTest(page, url);
  await openDevToolsTab(page);

  await warpToMessage(page, "ExampleFinished");

  await executeTerminalExpression(page, "{foo: 'abc', bar: 123}");
  await verifyConsoleMessage(page, '{foo: "abc", bar: 123}');
});
