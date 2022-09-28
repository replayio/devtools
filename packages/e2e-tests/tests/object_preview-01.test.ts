import {
  test,
  openExample,
  clickDevTools,
  executeInConsole,
  selectConsole,
  warpToMessage,
  waitForConsoleMessage,
} from "../helpers";

test(`expressions in the console after time warping.`, async ({ screen }) => {
  await openExample(screen, "doc_rr_objects.html");
  await clickDevTools(screen);
  await selectConsole(screen);

  await waitForConsoleMessage(screen, "(20) [0, 1, 2, 3, 4, …]");
  await waitForConsoleMessage(screen, "Uint8Array(20) [0, 1, 2, 3, 4, …]");
  await waitForConsoleMessage(screen, "Set(22) [{…}, {…}, 0, 1, 2, …]");

  await waitForConsoleMessage(screen, "Map(21) {{…} → {…}, 0 → 1, 1 → 2, 2 → 3, 3 → 4, …}");
  await waitForConsoleMessage(screen, "WeakSet(20) [{…}, {…}, {…}, {…}, {…}, …]");
  await waitForConsoleMessage(
    screen,
    "WeakMap(20) {{…} → {…}, {…} → {…}, {…} → {…}, {…} → {…}, {…} → {…}, …}"
  );
  await waitForConsoleMessage(screen, "{a: 0, a0: 0, a1: 1, a2: 2, a3: 3, …}");
  await waitForConsoleMessage(screen, "/abc/gi");
  await waitForConsoleMessage(screen, "Sun Aug 14 2022 12:23:25 GMT-0700 (Pacific Daylight Time)");

  await waitForConsoleMessage(screen, `RangeError: foo`);

  await waitForConsoleMessage(screen, "ƒbar()");

  await waitForConsoleMessage(screen, "Proxy{}");
  await waitForConsoleMessage(screen, "Symbol()");
  await waitForConsoleMessage(screen, "Symbol(symbol)");
  await waitForConsoleMessage(screen, `{Symbol(): 42, Symbol(symbol): Symbol()}`);

  await waitForConsoleMessage(screen, "{_foo: C{…}, foo: ƒ()}");

  await warpToMessage(screen, "Done");

  await executeInConsole(screen, "Error('helo')");
  await waitForConsoleMessage(screen, "Error: helo");

  await executeInConsole(screen, 'function f() { throw Error("there"); }()');
  await waitForConsoleMessage(screen, "Error: there");

  await executeInConsole(screen, "Array(1, 2, 3)");
  await waitForConsoleMessage(screen, "(3) [1, 2, 3]");

  await executeInConsole(screen, "new Uint8Array([1, 2, 3, 4])");
  await waitForConsoleMessage(screen, "Uint8Array(4) [1, 2, 3, 4]");

  await executeInConsole(screen, `RegExp("abd", "g")`);
  await waitForConsoleMessage(screen, "/abd/g");

  await executeInConsole(screen, "new Set([1, 2, 3])");
  await waitForConsoleMessage(screen, "Set(3) [1, 2, 3]");

  await executeInConsole(screen, "new Map([[1, {a:1}], [2, {b:2}]])");
  await waitForConsoleMessage(screen, "Map(2) {1 → {…}, 2 → {…}}");

  await executeInConsole(screen, "new WeakSet([{a:1}, {b:2}])");
  await waitForConsoleMessage(screen, "WeakSet(2) [{…}, {…}]");

  await executeInConsole(screen, "new WeakMap([[{a:1},{b:1}], [{a:2},{b:2}]])");
  await waitForConsoleMessage(screen, "WeakMap(2) {{…} → {…}, {…} → {…}}");

  await executeInConsole(screen, "new Promise(() => {})");
  await waitForConsoleMessage(screen, "Promise{}");

  await executeInConsole(screen, "Promise.resolve({ a: 1 })");
  await waitForConsoleMessage(screen, "Promise{}");

  await executeInConsole(screen, "Promise.reject({ a: 1 })");
  await waitForConsoleMessage(screen, "Promise{}");

  await executeInConsole(screen, "baz");
  await waitForConsoleMessage(screen, "ƒbaz()");
});
