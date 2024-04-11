import { openDevToolsTab, startTest } from "../helpers";
import {
  executeAndVerifyTerminalExpression,
  verifyConsoleMessageObjectContents,
  warpToMessage,
} from "../helpers/console-panel";
import { addLogpoint } from "../helpers/source-panel";
import test from "../testFixture";

test.use({ exampleKey: "doc_rr_console.html" });

test(`object_preview-07: inspect objects in the console while paused somewhere else`, async ({
  pageWithMeta: { page, recordingId, testScope },
  exampleKey,
}) => {
  await startTest(page, recordingId, testScope);
  await openDevToolsTab(page);

  await verifyConsoleMessageObjectContents(page, "Iteration 3", [
    "obj: {value: 6, subobj: {…}}",
    "value: 3",
    "[[Prototype]]: Object",
  ]);

  await addLogpoint(page, {
    content: '"Logpoint", iteration, object',
    lineNumber: 20,
    url: exampleKey,
  });

  await verifyConsoleMessageObjectContents(page, "Logpoint 5", [
    "obj: {value: 10, subobj: {…}}",
    "value: 5",
    "[[Prototype]]: Object",
  ]);

  await warpToMessage(page, "Iteration 7");
  await executeAndVerifyTerminalExpression(page, "{ a: { b: 1 } }", "{a: {…}}", false);
  await warpToMessage(page, "Iteration 8");
  await verifyConsoleMessageObjectContents(
    page,
    "{a: {…}}",
    ["a: {b: 1}", "[[Prototype]]: Object"],
    "terminal-expression"
  );
});
