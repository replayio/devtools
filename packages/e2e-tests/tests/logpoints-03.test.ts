import { openDevToolsTab, startTest } from "../helpers";
import { addEventListenerLogpoints, findConsoleMessage } from "../helpers/console-panel";
import test, { expect } from "../testFixtureCloneRecording";

test.use({ exampleKey: "doc_events.html" });

test(`logpoints-03: should display event properties in the console`, async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openDevToolsTab(page);

  await addEventListenerLogpoints(page, [{ eventType: "click", categoryKey: "mouse" }]);

  const message = await findConsoleMessage(page, "MouseEvent", "event");

  // TODO [FE-2109][RUN-2969] Make sure this test passes once Chromium supports RECORD_REPLAY.getFrameArgumentsArray
  await expect(message).toContainText('type: "click"');
});
