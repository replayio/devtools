import { openDevToolsTab, startTest } from "../helpers";
import {
  executeTerminalExpression,
  verifyConsoleTerminalTypeAheadSuggestions,
  warpToMessage,
} from "../helpers/console-panel";
import {
  addLogpoint,
  editLogPoint,
  findLineWithHits,
  rewindToLine,
  toggleMappedSources,
  verifyLogPointContentTypeAheadSuggestions,
} from "../helpers/source-panel";
import { delay } from "../helpers/utils";
import test from "../testFixture";

test.use({ exampleKey: "cra/dist/index.html" });

test(`logpoints-07: should use the correct scope in auto-complete`, async ({
  pageWithMeta: { page, recordingId, testScope },
  exampleKey,
}) => {
  await startTest(page, recordingId, testScope);
  await openDevToolsTab(page);

  let url = "App.js";
  let lineNumber = 17;

  await addLogpoint(page, { lineNumber, url, waitForSourceOutline: true });
  await warpToMessage(page, "update", lineNumber);

  // Log point should use original source (since we're viewing it)
  await editLogPoint(page, { content: "set", lineNumber, saveAfterEdit: false, url });
  await verifyLogPointContentTypeAheadSuggestions(page, ["setInterval", "setList"]);

  // Console should assume original source as well (by default)
  await executeTerminalExpression(page, "set", false);
  await verifyConsoleTerminalTypeAheadSuggestions(page, ["setInterval", "setList"]);

  // Log point should use generated source (if we're viewing that)
  // Toggling this will switch from the sourcemapped `App.js` to the minified bundle
  // that contained it (`main.XYZ.js`).
  await toggleMappedSources(page, "off");
  await delay(1000);

  // We expect the hit body in the minified bundle to land on line 20 or 21,
  // depending on how the generated source was pretty-printed (blank-line
  // placement differs between the V8 and js-beautify engines).
  lineNumber = await findLineWithHits(page, [20, 21]);
  await rewindToLine(page, { lineNumber });

  await addLogpoint(page, { lineNumber });
  await editLogPoint(page, { content: "set", lineNumber, saveAfterEdit: false });
  await verifyLogPointContentTypeAheadSuggestions(page, ["setInterval"], ["setList"]);

  await editLogPoint(page, { content: "l", lineNumber, saveAfterEdit: false });
  await verifyLogPointContentTypeAheadSuggestions(page, ["l", "la", "le", "li"]);
});
