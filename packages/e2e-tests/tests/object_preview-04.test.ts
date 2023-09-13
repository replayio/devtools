import { openDevToolsTab, startTest } from "../helpers";
import { executeAndVerifyTerminalExpression, warpToMessage } from "../helpers/console-panel";
import {
  expandAllScopesBlocks,
  waitForPaused,
  waitForScopeValue,
} from "../helpers/pause-information-panel";
import { addBreakpoint, addLogpoint, toggleMappedSources } from "../helpers/source-panel";
import test from "../testFixtureCloneRecording";

test.use({ exampleKey: "doc_prod_bundle.html" });

test(`object_preview-04: Test scope mapping and switching between generated/original sources`, async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openDevToolsTab(page);

  await addBreakpoint(page, { lineNumber: 15, url: "bundle_input.js" });
  await addLogpoint(page, {
    content: "barobj.barprop1 * 10",
    lineNumber: 15,
    url: "bundle_input.js",
  });

  await warpToMessage(page, "20", 15);

  await expandAllScopesBlocks(page);
  await waitForScopeValue(page, "bar", "ƒo()");
  await waitForScopeValue(page, "bararr", "(3) [5, 6");
  await waitForScopeValue(page, "barobj", "{barprop1: 2, barprop2: 3");

  await executeAndVerifyTerminalExpression(page, "bararr.length * 100", 300);

  await toggleMappedSources(page, "off");
  await waitForPaused(page, 12);

  await expandAllScopesBlocks(page);
  await waitForScopeValue(page, "e", "(3) [");
  await waitForScopeValue(page, "o", "{…}");
});
