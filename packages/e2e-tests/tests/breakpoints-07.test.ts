import { openDevToolsTab, startTest } from "../helpers";
import { quickOpen } from "../helpers/commands";
import {
  findConsoleMessage,
  openMessageSource,
  seekToConsoleMessage,
} from "../helpers/console-panel";
import { rewindToLine } from "../helpers/pause-information-panel";
import {
  addBreakpoint,
  addLogpoint,
  closeSource,
  getSourceTab,
  verifyLogpointStep,
  waitForBreakpoint,
  waitForLogpoint,
} from "../helpers/source-panel";
import { debugPrint } from "../helpers/utils";
import test from "../testFixture";

test.use({ exampleKey: "doc_navigate.html" });

test(`breakpoints-07: rewind and seek using command bar and console messages`, async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openDevToolsTab(page);

  await quickOpen(page, "bundle_input.js");

  await addBreakpoint(page, { lineNumber: 5, url: "bundle_input.js" });
  await addLogpoint(page, { lineNumber: 5, url: "bundle_input.js" });

  // Verify that the command bar can be used to fast forward and rewind to log points.
  await rewindToLine(page, 5);
  await verifyLogpointStep(page, "2/2", { lineNumber: 5 });
  await rewindToLine(page, 5);
  await verifyLogpointStep(page, "1/2", { lineNumber: 5 });

  await closeSource(page, "bundle_input.js");

  // Verify that the Console allows rewinding/fast forwarding to log points as well.
  const message = await findConsoleMessage(page, "bundle_input", "log-point");
  await seekToConsoleMessage(page, message.last());
  await verifyLogpointStep(page, "2/2", { lineNumber: 5 });
  await seekToConsoleMessage(page, message.first());
  await verifyLogpointStep(page, "1/2", { lineNumber: 5 });

  await closeSource(page, "bundle_input.js");

  const sourceTab = getSourceTab(page, "bundle_input.js");

  // Verify that clicking on the source location in the Console opens the source editor.
  await sourceTab.waitFor({ state: "detached" });
  await openMessageSource(page, message.first());
  await sourceTab.waitFor({ state: "visible" });

  // Verify that the active source and breakpoints/logpoints are restored after a reload.
  debugPrint(page, "Reloading page to check that breakpoints/logpoints are restored");
  await page.reload();
  await openDevToolsTab(page); // Should be unnecessary but sometimes "Viewer" tab is selected
  await quickOpen(page, "bundle_input.js"); // Should be unnecessary
  await sourceTab.waitFor({ state: "visible" });

  await waitForBreakpoint(page, { lineNumber: 5, url: "bundle_input.js" });
  await waitForLogpoint(page, { lineNumber: 5, url: "bundle_input.js" });
});
