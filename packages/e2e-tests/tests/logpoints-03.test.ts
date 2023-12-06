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

  await addEventListenerLogpoints(page, [{ eventType: "event.mouse.click", categoryKey: "mouse" }]);

  const message = await findConsoleMessage(page, "(click)", "event");

  await expect(message).toContainText("doc_events.html");
});
