import {
  addBreakpoint,
  addLogpoint,
  clickDevTools,
  closeSource,
  getConsoleMessage,
  getSourceTab,
  openExample,
  openMessageSource,
  quickOpen,
  rewindToLine,
  seekToConsoleMessage,
  test,
  verifyBreakpointStatus,
} from "../helpers";

test(`Test TODO name this thing.`, async ({ screen }) => {
  await openExample(screen, "doc_navigate.html");
  await clickDevTools(screen);

  await quickOpen(screen, "bundle_input.js");

  await addBreakpoint(screen, { lineNumber: 5, url: "bundle_input.js" });
  await addLogpoint(screen, { lineNumber: 5, url: "bundle_input.js" });

  // Verify that the command bar can be used to fast forward and rewind to log points.
  await rewindToLine(screen, { lineNumber: 5 });
  await verifyBreakpointStatus(screen, "2/2", { lineNumber: 5 });
  await rewindToLine(screen, { lineNumber: 5 });
  await verifyBreakpointStatus(screen, "1/2", { lineNumber: 5 });

  await closeSource(screen, "bundle_input.js");

  // Verify that the Console allows rewinding/fast forwarding to log points as well.
  const message = await getConsoleMessage(screen, "bundle_input", "log-point");
  await seekToConsoleMessage(screen, message.last());
  await verifyBreakpointStatus(screen, "2/2", { lineNumber: 5 });
  await seekToConsoleMessage(screen, message.first());
  await verifyBreakpointStatus(screen, "1/2", { lineNumber: 5 });

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
