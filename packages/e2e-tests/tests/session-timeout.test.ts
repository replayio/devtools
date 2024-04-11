import { openDevToolsTab, startTest } from "../helpers";
import { verifyErrorDialog } from "../helpers/errors";
import test from "../testFixture";

test.use({ exampleKey: "doc_control_flow.html" });

test(`session-timeout: errors caused by session failure should bubble to the root`, async ({
  pageWithMeta: { page, recordingId, testScope },
  exampleKey,
}) => {
  await startTest(page, recordingId, testScope);
  await openDevToolsTab(page);

  await page.evaluate(() => {
    // Testing an actual timeout would take > 15 minutes,
    // but we can use the protocol client to force a session's destruction instead
    // @ts-expect-error
    app.client.Recording.releaseSession({ sessionId });
  });

  await verifyErrorDialog(page, {
    expectedDetails: "This replay timed out to reduce server load.",
    expectedTitle: "Ready when you are!",
    expectedType: "expected",
  });
});
