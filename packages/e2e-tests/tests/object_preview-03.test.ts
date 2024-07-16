import { openDevToolsTab, startTest } from "../helpers";
import {
  expandAllScopesBlocks,
  getScopeChildren,
  reverseStepOverToLine,
  selectFrame,
  stepInToLine,
  stepOverToLine,
  verifyFramesCount,
  waitForFrameTimeline,
  waitForScopeValue,
} from "../helpers/pause-information-panel";
import { openSource } from "../helpers/source-explorer-panel";
import { rewindToLine } from "../helpers/source-panel";
import { toggleExpandable } from "../helpers/utils";
import test from "../testFixture";

test.use({ exampleKey: "doc_rr_preview.html" });

// Note: Because stepping works differently between gecko and chromium,
// frame timeline percentages are different in the test below.

test(`object_preview-03: Test previews when switching between frames and stepping`, async ({
  pageWithMeta: { page, recordingId, testScope },
  exampleKey,
}) => {
  await startTest(page, recordingId, testScope);
  await openDevToolsTab(page);

  await openSource(page, exampleKey);
  await rewindToLine(page, { lineNumber: 17 });

  await expandAllScopesBlocks(page);

  const barScope = getScopeChildren(page, "bar");

  await toggleExpandable(page, { scope: barScope, text: "barobj" });
  await waitForScopeValue(page, "barprop1", 2, false);
  await waitForScopeValue(page, "barprop2", 3, false);

  await waitForFrameTimeline(page, "75%");
  await verifyFramesCount(page, 2);
  await selectFrame(page, 1);

  const fooScope = getScopeChildren(page, "foo");
  await expandAllScopesBlocks(page);
  await toggleExpandable(page, { scope: fooScope, text: "fooobj" });
  await waitForScopeValue(page, "fooprop1", 0, false);
  await waitForScopeValue(page, "fooprop2", 1, false);

  await selectFrame(page, 0);
  await stepOverToLine(page, 18);
  await waitForFrameTimeline(page, "100%");
  await waitForScopeValue(page, "barprop1", '"updated"', false);
  await waitForScopeValue(page, "barprop2", 3, false);

  await reverseStepOverToLine(page, 17);
  await waitForScopeValue(page, "barprop1", "2", false);

  await stepInToLine(page, 21);
  await stepOverToLine(page, 22);
  await waitForFrameTimeline(page, "66%");
  await verifyFramesCount(page, 3);
  await selectFrame(page, 1);
  await waitForFrameTimeline(page, "75%");
  await selectFrame(page, 2);
  await waitForFrameTimeline(page, "100%");
});
