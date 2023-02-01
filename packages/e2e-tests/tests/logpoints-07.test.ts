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
  toggleMappedSources,
  verifyLogPointContentTypeAheadSuggestions,
} from "../helpers/source-panel";

test(`logpoints-07: should use the correct scope in auto-complete`, async ({ page }) => {
  await startTest(page, "cra/dist/index.html");
  await openDevToolsTab(page);

  let url = "App.js";
  let lineNumber = 17;

  await addLogpoint(page, { lineNumber, url });
  await warpToMessage(page, "update", lineNumber);

  // Log point should use original source (since we're viewing it)
  await editLogPoint(page, { content: "set", lineNumber, saveAfterEdit: false, url });
  await verifyLogPointContentTypeAheadSuggestions(page, ["setInterval", "setList"]);

  // Console should assume original source as well (by default)
  await executeTerminalExpression(page, "set", false);
  await verifyConsoleTerminalTypeAheadSuggestions(page, ["setInterval", "setList"]);

  // Log point should use generated source (if we're viewing that)
  await toggleMappedSources(page, "off");

  lineNumber = 19;

  await addLogpoint(page, { lineNumber });
  await editLogPoint(page, { content: "set", lineNumber, saveAfterEdit: false });
  await verifyLogPointContentTypeAheadSuggestions(page, ["setInterval"], ["setList"]);

  await editLogPoint(page, { content: "l", lineNumber, saveAfterEdit: false });
  await verifyLogPointContentTypeAheadSuggestions(page, ["l", "la", "le", "li"]);
});
