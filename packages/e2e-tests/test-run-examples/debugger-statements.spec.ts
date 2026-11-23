import { openDevToolsTab, startTest } from "../helpers";
import {
  openPauseInformationPanel,
  reverseStepOverToLine,
  waitForPaused,
} from "../helpers/pause-information-panel";
import { openSource } from "../helpers/source-explorer-panel";
import { fastForwardToLine, rewindToLine } from "../helpers/source-panel";
import test from "../testFixture";

test.use({ exampleKey: "doc_debugger_statements.html" });

test(`debugger-statements: rewind and fast-forward between debugger statements`, async ({
  pageWithMeta: { page, recordingId, testScope },
  exampleKey,
}) => {
  await startTest(page, recordingId, testScope);
  await openDevToolsTab(page);
  await openPauseInformationPanel(page);
  await openSource(page, exampleKey);

  await rewindToLine(page, { lineNumber: 9 });
  await waitForPaused(page, 9);

  await rewindToLine(page, { lineNumber: 7 });
  await waitForPaused(page, 7);

  await fastForwardToLine(page, { lineNumber: 9 });
  await waitForPaused(page, 9);

  await reverseStepOverToLine(page, 8);
});
