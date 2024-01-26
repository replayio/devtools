import { openDevToolsTab, startTest } from "../helpers";
import {
  addEventListenerLogpoints,
  expandConsoleMessage,
  findConsoleMessage,
} from "../helpers/console-panel";
import test, { expect } from "../testFixtureCloneRecording";

test.use({ exampleKey: "doc_events.html" });

test(`logpoints-03: should display event properties in the console`, async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openDevToolsTab(page);

  await addEventListenerLogpoints(page, [{ eventType: "click", categoryKey: "mouse" }]);

  const message = await findConsoleMessage(page, "(click)", "event");

  await expandConsoleMessage(message);

  await expect(message).toContainText('type: "click"');
  await expect(message).toContainText("target: <div");
  await expect(message).toContainText("clientX: 0");
  await expect(message).toContainText("clientY: 0");
});
