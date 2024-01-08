import { openDevToolsTab, startTest } from "../helpers";
import {
  addEventListenerLogpoints,
  expandConsoleMessage,
  findConsoleMessage,
} from "../helpers/console-panel";
import test, { expect } from "../testFixtureCloneRecording";

// This test file is identical to `logpoints-03.test`, except for the example filename
// and the event type string. We've copy-pasted it to simplify getting _any_ E2E test working.
test.use({ exampleKey: "doc_events_chromium.html" });

// TODO [FE-2118] Re-enable this test once RUN-2669 eventually ships
test.skip(`logpoints-03_chromium: should display event properties in the console`, async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openDevToolsTab(page);

  // WARNING: Our Chromium events logic does _not_ actually use the `event.x.y` naming convention.
  // However, the E2E test helpers _do_ need this pattern to determine what categories to expand.
  await addEventListenerLogpoints(page, [{ eventType: "click", categoryKey: "mouse" }]);

  const message = await findConsoleMessage(page, "PointerEvent", "event");

  expandConsoleMessage(message);

  await expect(message).toContainText('type: "click"');
  await expect(message).toContainText("target: <div");
  await expect(message).toContainText("clientX: 0");
  await expect(message).toContainText("clientY: 0");
});
