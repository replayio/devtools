import { openDevToolsTab, startTest } from "../helpers";
import { executeAndVerifyTerminalExpression } from "../helpers/console-panel";
import { openEventsPanel } from "../helpers/info-event-panel";
import { resumeToLine, rewindToLine } from "../helpers/pause-information-panel";
import { openSourceExplorerPanel } from "../helpers/source-explorer-panel";
import { addBreakpoint } from "../helpers/source-panel";
import { delay } from "../helpers/utils";
import test from "../testFixtureCloneRecording";

test.use({ exampleKey: "redux-fundamentals/dist/index.html" });

test(`jump-to-code-01: Test basic jumping functionality`, async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, exampleKey, recordingId);
  await openDevToolsTab(page);

  await openSourceExplorerPanel(page);
  await openEventsPanel(page);
  await delay(5000);
});
