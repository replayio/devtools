import test from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import {
  openScopeBlocks,
  rewindToLine,
  waitForFrameTimeline,
  waitForScopeValue,
} from "../helpers/pause-information-panel";
import { addBreakpoint } from "../helpers/source-panel";
import { toggleExpandable } from "../helpers/utils";

const url = "doc_rr_preview.html";

// Note: Because stepping works differently between gecko and chromium,
// frame timeline percentages are different in the test below.

test(`Test previews when switching between frames and stepping.`, async ({ page }) => {
  await startTest(page, url);
  await openDevToolsTab(page);

  await addBreakpoint(page, { lineNumber: 17, url });
  await rewindToLine(page, { lineNumber: 17, url });

  await openScopeBlocks(page, "Block");

  await toggleExpandable(page, { text: "barobj" });
  await waitForScopeValue(page, "barprop1", 2);
  await waitForScopeValue(page, "barprop2", 3);

  // TODO [FE-626] target == "gecko" ? "42%" : "75%"
  await waitForFrameTimeline(page, "42%");

  // await Test.checkFrames(2);
  // await Test.selectFrame(1);
  // await Test.toggleScopeNode("fooobj");
  // await Test.findScopeNode("fooprop1");
  // await Test.findScopeNode("fooprop2");
  // await Test.selectFrame(0);
  // await Test.stepOverToLine(18);
  // await Test.waitForFrameTimeline(target == "gecko" ? "71%" : "100%");
  // await Test.toggleScopeNode("barobj");
  // await Test.findScopeNode("barprop1");
  // await Test.waitForScopeValue("barprop1", `"updated"`);
  // await Test.reverseStepOverToLine(17);
  // await Test.toggleScopeNode("barobj");
  // await Test.findScopeNode("barprop1");
  // await Test.waitForScopeValue("barprop1", "2");
  // await Test.stepInToLine(21);
  // await Test.stepOverToLine(22);
  // await Test.waitForFrameTimeline(target == "gecko" ? "50%" : "100%");
  // await Test.checkFrames(3);
  // await Test.selectFrame(1);
  // await Test.waitForFrameTimeline(target == "gecko" ? "57%" : "75%");
  // await Test.selectFrame(2);
  // await Test.waitForFrameTimeline(target == "gecko" ? "66%" : "100%");
});
