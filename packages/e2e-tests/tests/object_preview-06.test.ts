import { openDevToolsTab, startTest } from "../helpers";
import {
  clearConsoleEvaluations,
  disableAllConsoleMessageTypes,
  executeTerminalExpression,
  openConsolePanel,
  verifyConsoleMessage,
  warpToMessage,
} from "../helpers/console-panel";
import test from "../testFixtureCloneRecording";

test.use({ exampleKey: "doc_rr_objects.html" });

test(`object_preview-06: HTML elements`, async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openDevToolsTab(page);
  await openConsolePanel(page);

  await warpToMessage(page, "5ExampleFinished");
  await disableAllConsoleMessageTypes(page);

  await executeTerminalExpression(page, "document.body");
  await verifyConsoleMessage(page, "<body>…<body>");
  await clearConsoleEvaluations(page);

  await executeTerminalExpression(page, "document.getElementsByTagName('body')");
  await verifyConsoleMessage(page, "HTMLCollection");
  await verifyConsoleMessage(page, "<body>…<body>");
  await clearConsoleEvaluations(page);

  await executeTerminalExpression(page, "document.querySelector('script')");
  await verifyConsoleMessage(page, "function recordingFinished");
  await clearConsoleEvaluations(page);

  await executeTerminalExpression(page, "document.querySelector('[blahblah]').textContent");
  await verifyConsoleMessage(page, "BAR");
  await clearConsoleEvaluations(page);
});
