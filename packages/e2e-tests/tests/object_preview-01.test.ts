import test from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import {
  executeTerminalExpression,
  openConsolePanel,
  verifyConsoleMessage,
  warpToMessage,
} from "../helpers/console-panel";

test(`object_preview-01: expressions in the console after time warping`, async ({ page }) => {
  await startTest(page, "doc_rr_objects.html");
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

  await verifyConsoleMessage(page, "Proxy{}");
  await verifyConsoleMessage(page, "Symbol()");
  await verifyConsoleMessage(page, "Symbol(symbol)");
  await verifyConsoleMessage(page, `{Symbol(): 42, Symbol(symbol): Symbol()}`);

  await verifyConsoleMessage(page, "{_foo: C{…}, foo: ƒ()}");

  await warpToMessage(page, "Done");

  await executeTerminalExpression(page, "Error('helo')");
  await verifyConsoleMessage(page, "Error: helo");

  await executeTerminalExpression(page, '(function f() { throw Error("there"); })()');
  await verifyConsoleMessage(page, "Error: there");

  await executeTerminalExpression(page, "Array(1, 2, 3)");
  await verifyConsoleMessage(page, "(3) [1, 2, 3]");

  await executeTerminalExpression(page, "new Uint8Array([1, 2, 3, 4])");
  await verifyConsoleMessage(page, "Uint8Array(4) [1, 2, 3, 4]");

  await executeTerminalExpression(page, `RegExp("abd", "g")`);
  await verifyConsoleMessage(page, "/abd/g");

  await executeTerminalExpression(page, "new Set([1, 2, 3])");
  await verifyConsoleMessage(page, "Set(3) [1, 2, 3]");

  await executeTerminalExpression(page, "new Map([[1, {a:1}], [2, {b:2}]])");
  await verifyConsoleMessage(page, "Map(2) {1 → {…}, 2 → {…}}");

  await executeTerminalExpression(page, "new WeakSet([{a:1}, {b:2}])");
  await verifyConsoleMessage(page, "WeakSet(2) [{…}, {…}]");

  await executeTerminalExpression(page, "new WeakMap([[{a:1},{b:1}], [{a:2},{b:2}]])");
  await verifyConsoleMessage(page, "WeakMap(2) {{…} → {…}, {…} → {…}}");

  await executeTerminalExpression(page, "new Promise(() => {})");
  await verifyConsoleMessage(page, "Promise{}");

  await executeTerminalExpression(page, "Promise.resolve({ a: 1 })");
  await verifyConsoleMessage(page, "Promise{}");

  await executeTerminalExpression(page, "Promise.reject({ a: 1 })");
  await verifyConsoleMessage(page, "Promise{}");

  await executeTerminalExpression(page, "baz");
  await verifyConsoleMessage(page, "ƒbaz()");
});
