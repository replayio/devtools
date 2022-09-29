import { openDevToolsTab, startTest, test } from "../helpers";
import {
  executeTerminalExpression,
  openConsolePanel,
  verifyConsoleMessage,
  warpToMessage,
} from "../helpers/console-panel";

test(`expressions in the console after time warping.`, async ({ screen }) => {
  await startTest(screen, "doc_rr_objects.html");
  await openDevToolsTab(screen);
  await openConsolePanel(screen);

  await verifyConsoleMessage(screen, "(20) [0, 1, 2, 3, 4, …]");
  await verifyConsoleMessage(screen, "Uint8Array(20) [0, 1, 2, 3, 4, …]");
  await verifyConsoleMessage(screen, "Set(22) [{…}, {…}, 0, 1, 2, …]");

  await verifyConsoleMessage(screen, "Map(21) {{…} → {…}, 0 → 1, 1 → 2, 2 → 3, 3 → 4, …}");
  await verifyConsoleMessage(screen, "WeakSet(20) [{…}, {…}, {…}, {…}, {…}, …]");
  await verifyConsoleMessage(
    screen,
    "WeakMap(20) {{…} → {…}, {…} → {…}, {…} → {…}, {…} → {…}, {…} → {…}, …}"
  );
  await verifyConsoleMessage(screen, "{a: 0, a0: 0, a1: 1, a2: 2, a3: 3, …}");
  await verifyConsoleMessage(screen, "/abc/gi");
  await verifyConsoleMessage(screen, "Sun Aug 14 2022 12:23:25 GMT-0700 (Pacific Daylight Time)");

  await verifyConsoleMessage(screen, `RangeError: foo`);

  await verifyConsoleMessage(screen, "ƒbar()");

  await verifyConsoleMessage(screen, "Proxy{}");
  await verifyConsoleMessage(screen, "Symbol()");
  await verifyConsoleMessage(screen, "Symbol(symbol)");
  await verifyConsoleMessage(screen, `{Symbol(): 42, Symbol(symbol): Symbol()}`);

  await verifyConsoleMessage(screen, "{_foo: C{…}, foo: ƒ()}");

  await warpToMessage(screen, "Done");

  await executeTerminalExpression(screen, "Error('helo')");
  await verifyConsoleMessage(screen, "Error: helo");

  await executeTerminalExpression(screen, 'function f() { throw Error("there"); }()');
  await verifyConsoleMessage(screen, "Error: there");

  await executeTerminalExpression(screen, "Array(1, 2, 3)");
  await verifyConsoleMessage(screen, "(3) [1, 2, 3]");

  await executeTerminalExpression(screen, "new Uint8Array([1, 2, 3, 4])");
  await verifyConsoleMessage(screen, "Uint8Array(4) [1, 2, 3, 4]");

  await executeTerminalExpression(screen, `RegExp("abd", "g")`);
  await verifyConsoleMessage(screen, "/abd/g");

  await executeTerminalExpression(screen, "new Set([1, 2, 3])");
  await verifyConsoleMessage(screen, "Set(3) [1, 2, 3]");

  await executeTerminalExpression(screen, "new Map([[1, {a:1}], [2, {b:2}]])");
  await verifyConsoleMessage(screen, "Map(2) {1 → {…}, 2 → {…}}");

  await executeTerminalExpression(screen, "new WeakSet([{a:1}, {b:2}])");
  await verifyConsoleMessage(screen, "WeakSet(2) [{…}, {…}]");

  await executeTerminalExpression(screen, "new WeakMap([[{a:1},{b:1}], [{a:2},{b:2}]])");
  await verifyConsoleMessage(screen, "WeakMap(2) {{…} → {…}, {…} → {…}}");

  await executeTerminalExpression(screen, "new Promise(() => {})");
  await verifyConsoleMessage(screen, "Promise{}");

  await executeTerminalExpression(screen, "Promise.resolve({ a: 1 })");
  await verifyConsoleMessage(screen, "Promise{}");

  await executeTerminalExpression(screen, "Promise.reject({ a: 1 })");
  await verifyConsoleMessage(screen, "Promise{}");

  await executeTerminalExpression(screen, "baz");
  await verifyConsoleMessage(screen, "ƒbaz()");
});
