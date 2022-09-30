import test from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import { executeAndVerifyTerminalExpression, warpToMessage } from "../helpers/console-panel";
import {
  expandAllScopesBlocks,
  getScopeChildren,
  reverseStepOverToLine,
  rewindToLine,
  selectFrame,
  stepInToLine,
  stepOverToLine,
  verifyFramesCount,
  waitForFrameTimeline,
  waitForScopeValue,
} from "../helpers/pause-information-panel";
import { addBreakpoint, addLogpoint } from "../helpers/source-panel";
import { delay, toggleExpandable } from "../helpers/utils";

const url = "doc_prod_bundle.html";

test(`Test scope mapping and switching between generated/original sources.`, async ({ page }) => {
  await startTest(page, url);
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

  await delay(5_000);

  // TODO [FE-626]
  // await Test.toggleMappedSources();
  // await Test.waitForPausedLine(12);
  // await Test.waitForScopeValue("e", "(3) […]");
  // await Test.waitForScopeValue("o", "{…}");
});
