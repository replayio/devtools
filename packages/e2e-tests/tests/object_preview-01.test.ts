import { openDevToolsTab, startTest } from "../helpers";
import {
  clearTerminalExpressions,
  executeTerminalExpression,
  findConsoleMessage,
  openConsolePanel,
  verifyConsoleMessage,
  verifyConsoleMessageObjectContents,
  warpToMessage,
} from "../helpers/console-panel";
import { toggleExpandable } from "../helpers/utils";
import test from "../testFixtureCloneRecording";

test.use({ exampleKey: "doc_rr_objects.html" });

test(`object_preview-01: expressions in the console after time warping`, async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openDevToolsTab(page);
  await openConsolePanel(page);

  await verifyConsoleMessage(page, "(20) [0, 1, 2, 3, 4, …]");
  await verifyConsoleMessage(page, "Uint8Array(20) [0, 1, 2, 3, 4, …]");
  await verifyConsoleMessage(page, "Set(22) [{…}, {…}, 0, 1, 2, …]");

  await verifyConsoleMessage(page, "Map(21) {{…} → {…}, 0 → 1, 1 → 2, 2 → 3, 3 → 4, …}");
  await verifyConsoleMessage(page, "WeakSet(20) [{…}, {…}, {…}, {…}, {…}, …]");
  await verifyConsoleMessage(
    page,
    "WeakMap(20) {{…} → {…}, {…} → {…}, {…} → {…}, {…} → {…}, {…} → {…}, …}"
  );
  await verifyConsoleMessage(page, "{a: 0, a0: 0, a1: 1, a2: 2, a3: 3, …}");
  await verifyConsoleMessage(page, "/abc/gi");
  await verifyConsoleMessage(page, "Tue Oct 18");

  await verifyConsoleMessage(page, `RangeError: foo`);

  await verifyConsoleMessage(page, "ƒbar()");

  await verifyConsoleMessageObjectContents(page, "Proxy{}", [
    "<target>: {a: 0}",
    // TODO add function parameter names when RUN-3146 is fixed
    "<handler>: {get: ƒget()}",
  ]);

  await verifyConsoleMessage(page, "Symbol()");
  await verifyConsoleMessage(page, "Symbol(symbol)");
  await verifyConsoleMessage(page, `{Symbol(): 42, Symbol(symbol): Symbol()}`);

  const objectInspector = (await findConsoleMessage(page, "{_foo: C{…}, foo: ƒget foo()}")).locator(
    '[data-test-name="LogContents"]'
  );
  await toggleExpandable(page, { scope: objectInspector, targetState: "open" });
  await objectInspector
    .locator(
      '[data-test-name="GetterRenderer"]:has-text("foo") [data-test-name="GetterRenderer-LoadValueButton"]'
    )
    .click();
  await objectInspector
    .locator('[data-test-name="GetterRenderer"]:has-text("foo: C{…}")')
    .waitFor();

  await warpToMessage(page, "Done");

  await executeTerminalExpression(page, "Error('helo')");
  await verifyConsoleMessage(page, "Error: helo");

  await executeTerminalExpression(page, '(function f() { throw Error("there"); })()');
  await verifyConsoleMessage(page, "Error: there");

  await executeTerminalExpression(page, "Array(1, 2, 3)");
  await verifyConsoleMessageObjectContents(page, "(3) [1, 2, 3]", [
    "0: 1",
    "1: 2",
    "2: 3",
    "length: 3",
    "[[Prototype]]: Array",
  ]);

  await executeTerminalExpression(page, "new Uint8Array([1, 2, 3, 4])");
  await verifyConsoleMessage(page, "Uint8Array(4) [1, 2, 3, 4]");

  await executeTerminalExpression(page, `RegExp("abd", "g")`);
  await verifyConsoleMessage(page, "/abd/g");

  await executeTerminalExpression(page, "new Set([1, 2, 3])");
  await verifyConsoleMessageObjectContents(page, "Set(3) [1, 2, 3]", [
    "[[Entries]]",
    "0: 1",
    "1: 2",
    "2: 3",
    "size: 3",
    "[[Prototype]]: Set",
  ]);

  await executeTerminalExpression(page, "new Map([[1, {a:1}], [2, {b:2}]])");
  await verifyConsoleMessageObjectContents(page, "Map(2) {1 → {…}, 2 → {…}}", [
    "[[Entries]]",
    "0: {1 → {…}}",
    "1: {2 → {…}}",
    "size: 2",
    "[[Prototype]]: Map",
  ]);

  await executeTerminalExpression(page, "new WeakSet([{a:1}, {b:2}])");
  await verifyConsoleMessage(page, "WeakSet(2) [{…}, {…}]");

  await executeTerminalExpression(page, "new WeakMap([[{a:1},{b:1}], [{a:2},{b:2}]])");
  await verifyConsoleMessage(page, "WeakMap(2) {{…} → {…}, {…} → {…}}");

  await executeTerminalExpression(page, "new Promise(() => {})");
  await verifyConsoleMessageObjectContents(page, "Promise{}", [
    '<state>: "pending"',
    "[[Prototype]]: Promise",
  ]);

  await clearTerminalExpressions(page);
  await executeTerminalExpression(page, "Promise.resolve({ a: 1 })");
  await verifyConsoleMessageObjectContents(page, "Promise{}", [
    '<state>: "fulfilled"',
    "<value>: {a: 1}",
    "[[Prototype]]: Promise",
  ]);

  await clearTerminalExpressions(page);
  await executeTerminalExpression(page, "Promise.reject({ a: 1 })");
  await verifyConsoleMessageObjectContents(page, "Promise{}", [
    '<state>: "rejected"',
    "<value>: {a: 1}",
    "[[Prototype]]: Promise",
  ]);

  await executeTerminalExpression(page, "baz");
  await verifyConsoleMessage(page, "ƒbaz()");
});
