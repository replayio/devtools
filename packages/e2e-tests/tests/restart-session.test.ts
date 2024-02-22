import { commandPalette, openDevToolsTab, startTest } from "../helpers";
import { waitForRecordingToFinishIndexing } from "../helpers/utils";
import test from "../testFixtureCloneRecording";

test.use({ exampleKey: "doc_control_flow.html" });

test(`restart-session: restart debugging session`, async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openDevToolsTab(page);
  await commandPalette(page, "restart session");
  await page.waitForURL(/restart=true/);
  await waitForRecordingToFinishIndexing(page);
});
