import { openDevToolsTab, startTest } from "../helpers";
import { verifyErrorDialog } from "../helpers/errors";
import test from "../testFixture";

test.use({ exampleKey: "doc_control_flow.html" });

test(`session-destroyed: errors caused by session failure should bubble to the root`, async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openDevToolsTab(page);

  await page.evaluate(() => {
    // Testing an actual timeout would take > 15 minutes,
    // but we can use the protocol client to force a session's destruction instead
    // @ts-expect-error
    app.client.Recording.releaseSession({ sessionId });
  });

  await verifyErrorDialog(page, {
    expectedDetails: "The session was destroyed unexpectedly. Please refresh the page.",
    expectedTitle: "Unexpected end of session",
    expectedType: "unexpected",
  });
});
