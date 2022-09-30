import test from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import {
  executeAndVerifyTerminalExpression,
  openConsolePanel,
  verifyConsoleMessage,
  warpToMessage,
} from "../helpers/console-panel";
import { selectFrame, verifyFramesCount } from "../helpers/pause-information-panel";
import { addLogpoint } from "../helpers/source-panel";

const url = "doc_async.html";

test("support global console evaluations in async frames", async ({ page }) => {
  await startTest(page, url);
  await openDevToolsTab(page);
  await openConsolePanel(page);

  await addLogpoint(page, { content: '"qux", n', lineNumber: 20, url });
  await warpToMessage(page, "qux 2", 20);
  await verifyFramesCount(page, 5);

  await executeAndVerifyTerminalExpression(page, '"eval " + n', "eval 2");
  await selectFrame(page, 2);
  await executeAndVerifyTerminalExpression(page, '"eval " + n', "eval 3");
  await selectFrame(page, 4);
  await executeAndVerifyTerminalExpression(
    page,
    '"eval " + n',
    "The expression could not be evaluated."
  );

  await verifyConsoleMessage(page, "foo", "console-log");
  await verifyConsoleMessage(page, "bar", "console-log");
  await verifyConsoleMessage(page, "baz 4", "console-log");
  await verifyConsoleMessage(page, "baz 3", "console-log");
  await verifyConsoleMessage(page, "baz 2", "console-log");
  await verifyConsoleMessage(page, "baz 1", "console-log");
  await verifyConsoleMessage(page, "baz 0", "console-log");
  await verifyConsoleMessage(page, "ExampleFinished", "console-log");
});
