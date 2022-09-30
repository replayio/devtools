import test from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import {
  enableConsoleMessageType,
  openConsolePanel,
  verifyConsoleMessage,
} from "../helpers/console-panel";

test("Test that errors and warnings from various sources are shown in the console.", async ({
  page,
}) => {
  await startTest(page, "doc_exceptions_bundle.html");
  await openDevToolsTab(page);
  await openConsolePanel(page);

  await enableConsoleMessageType(page, "exceptions");
  await enableConsoleMessageType(page, "warnings");

  await verifyConsoleMessage(page, "ConsoleTrace");
  await verifyConsoleMessage(page, "ConsoleWarn");
  await verifyConsoleMessage(page, "ConsoleError");
  await verifyConsoleMessage(page, "ConsoleAssert");
  await verifyConsoleMessage(page, "Error: UncaughtError");
  await verifyConsoleMessage(page, "{number: 42}");
  await verifyConsoleMessage(page, "{number: 12}");
  await verifyConsoleMessage(page, "uncaught exception: [object Object]");
});
