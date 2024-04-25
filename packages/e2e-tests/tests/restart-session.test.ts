import { commandPalette, openDevToolsTab, startTest } from "../helpers";
import { waitForRecordingToFinishIndexing } from "../helpers/utils";
import test from "../testFixture";

test.use({ exampleKey: "doc_control_flow.html" });

test(`restart-session: restart debugging session`, async ({
  pageWithMeta: { page, recordingId, testScope },
  exampleKey,
}) => {
  await startTest(page, recordingId, testScope);
  await openDevToolsTab(page);
  await commandPalette(page, "restart session");
  await page.waitForURL(/restart=true/);
  await waitForRecordingToFinishIndexing(page);
});
