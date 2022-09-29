import { openDevToolsTab, startTest, test } from "../helpers";
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
} from "../helpers/source-panel";

test(`Test TODO name this thing.`, async ({ screen }) => {
  await startTest(screen, "doc_navigate.html");
  await openDevToolsTab(screen);

  await quickOpen(screen, "bundle_input.js");

  await addBreakpoint(screen, { lineNumber: 5, url: "bundle_input.js" });
  await addLogpoint(screen, { lineNumber: 5, url: "bundle_input.js" });

  // Verify that the command bar can be used to fast forward and rewind to log points.
  await rewindToLine(screen, { lineNumber: 5 });
  await verifyLogpointStep(screen, "2/2", { lineNumber: 5 });
  await rewindToLine(screen, { lineNumber: 5 });
  await verifyLogpointStep(screen, "1/2", { lineNumber: 5 });

  await closeSource(screen, "bundle_input.js");

  // Verify that the Console allows rewinding/fast forwarding to log points as well.
  const message = await findConsoleMessage(screen, "bundle_input", "log-point");
  await seekToConsoleMessage(screen, message.last());
  await verifyLogpointStep(screen, "2/2", { lineNumber: 5 });
  await seekToConsoleMessage(screen, message.first());
  await verifyLogpointStep(screen, "1/2", { lineNumber: 5 });

  await closeSource(screen, "bundle_input.js");

  const sourceTab = getSourceTab(screen, "bundle_input.js");

  // Verify that clicking on the source location in the Console opens the source editor.
  await sourceTab.waitFor({ state: "detached" });
  await openMessageSource(message.first());
  await sourceTab.waitFor({ state: "visible" });

  // Verify that the active source and breakpoints/logpoints are restored after a reload.
  await screen.reload();
  await sourceTab.waitFor({ state: "visible" });

  // TODO [FE-757] Re-enable these once both breakpoints and log points are reliably restored after reloading
  // await waitForBreakpoint(screen, { lineNumber: 5, url: "bundle_input.js" });
  // await waitForLogpoint(screen, { lineNumber: 5, url: "bundle_input.js" });
});
