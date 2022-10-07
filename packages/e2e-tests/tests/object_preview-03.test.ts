import test from "@playwright/test";

import { getRecordingTarget, openDevToolsTab, startTest } from "../helpers";
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
import { addBreakpoint } from "../helpers/source-panel";
import { toggleExpandable } from "../helpers/utils";

const url = "doc_rr_preview.html";

// Note: Because stepping works differently between gecko and chromium,
// frame timeline percentages are different in the test below.

test(`object_preview-03: Test previews when switching between frames and stepping`, async ({
  page,
}) => {
  await startTest(page, url);
  await openDevToolsTab(page);

  const target = await getRecordingTarget(page);

  await addBreakpoint(page, { lineNumber: 17, url });
  await rewindToLine(page, { lineNumber: 17, url });

  await expandAllScopesBlocks(page);

  const blockScope = getScopeChildren(page, "Block");

  await toggleExpandable(page, { scope: blockScope, text: "barobj" });
  await waitForScopeValue(page, "barprop1", 2);
  await waitForScopeValue(page, "barprop2", 3);

  await waitForFrameTimeline(page, target == "gecko" ? "42%" : "75%");

  await verifyFramesCount(page, 2);
  await selectFrame(page, 1);
  await toggleExpandable(page, { scope: blockScope, text: "fooobj" });
  await waitForScopeValue(page, "fooprop1", 0);
  await waitForScopeValue(page, "fooprop2", 1);

  await selectFrame(page, 0);
  await stepOverToLine(page, 18);
  await waitForFrameTimeline(page, target == "gecko" ? "71%" : "100%");
  await expandAllScopesBlocks(page);
  await toggleExpandable(page, { scope: blockScope, text: "barobj" });
  await waitForScopeValue(page, "barprop1", '"updated"');
  await waitForScopeValue(page, "barprop2", 3);

  await reverseStepOverToLine(page, 17);
  await expandAllScopesBlocks(page);
  await toggleExpandable(page, { scope: blockScope, text: "barobj" });
  await waitForScopeValue(page, "barprop1", "2");

  await stepInToLine(page, 21);
  await stepOverToLine(page, 22);
  await waitForFrameTimeline(page, target == "gecko" ? "50%" : "100%");
  await verifyFramesCount(page, 3);
  await selectFrame(page, 1);
  await waitForFrameTimeline(page, target == "gecko" ? "57%" : "75%");
  await selectFrame(page, 2);
  await waitForFrameTimeline(page, target == "gecko" ? "66%" : "100%");
});
