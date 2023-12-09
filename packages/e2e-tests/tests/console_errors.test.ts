import { openDevToolsTab, startTest } from "../helpers";
import {
  enableConsoleMessageType,
  openConsolePanel,
  toggleSideFilters,
  verifyConsoleMessage,
} from "../helpers/console-panel";
import test from "../testFixtureCloneRecording";

test.use({ exampleKey: "doc_exceptions_bundle.html" });

test("console_errors: Test that errors and warnings from various sources are shown in the console", async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openDevToolsTab(page);
  await openConsolePanel(page);

  await toggleSideFilters(page, true);
  await enableConsoleMessageType(page, "exceptions");
  await enableConsoleMessageType(page, "warnings");

  // TODO [FE-2109][RUN-2962] Re-record "doc_exceptions_bundle.html" once Chromium properly reports Console APIs
  await verifyConsoleMessage(page, "ConsoleTrace");
  await verifyConsoleMessage(page, "ConsoleWarn");
  await verifyConsoleMessage(page, "ConsoleError");
  await verifyConsoleMessage(page, "ConsoleAssert");
  await verifyConsoleMessage(page, "Error: UncaughtError");
  await verifyConsoleMessage(page, "{number: 42}");
  await verifyConsoleMessage(page, "{number: 12}");
  await verifyConsoleMessage(page, "uncaught exception: [object Object]");
});
