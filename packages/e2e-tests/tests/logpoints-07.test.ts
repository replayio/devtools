import test from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import {
  executeTerminalExpression,
  verifyConsoleTerminalTypeAheadSuggestions,
  warpToMessage,
} from "../helpers/console-panel";
import {
  addLogpoint,
  editLogPoint,
  verifyLogPointTypeAheadSuggestions,
} from "../helpers/source-panel";

test(`logpoints-07: should use both original and global variables in auto-complete`, async ({
  page,
}) => {
  await startTest(page, "cra/dist/index.html");
  await openDevToolsTab(page);

  const url = "App.js";
  await addLogpoint(page, { lineNumber: 13, url });

  await warpToMessage(page, "update", 13);
  await executeTerminalExpression(page, "set", false);
  await verifyConsoleTerminalTypeAheadSuggestions(page, ["setInterval", "setList"]);

  await editLogPoint(page, { content: "set", lineNumber: 13, saveAfterEdit: false, url });
  await verifyLogPointTypeAheadSuggestions(page, ["setInterval", "setList"]);
});
