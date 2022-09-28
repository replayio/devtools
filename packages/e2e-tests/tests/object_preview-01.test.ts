import {
  test,
  openExample,
  clickDevTools,
  executeInConsole,
  checkMessageObjectContents,
  checkJumpIcon,
  selectConsole,
  warpToMessage,
  waitForConsoleMessage,
} from "../helpers";

// Test the objects produced by console.log() calls and by evaluating various
test(`expressions in the console after time warping.`, async ({ screen }) => {
  let message;

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
  // await waitForConsoleMessage(
  //   screen,
  //   '<div id="foo" class="bar" style="visibility: visible" blahblah="">BAR<div>'
  // );

  await waitForConsoleMessage(screen, "ƒbar()");
  // await checkJumpIcon(screen, "ƒbar()");
  // await new Promise(r => setTimeout(r, 100_000));

  // await waitForConsoleMessage(screen, '(6) [undefined, true, 3, null, "z", …]');
  await waitForConsoleMessage(screen, "Proxy{}");
  await waitForConsoleMessage(screen, "Symbol()");
  await waitForConsoleMessage(screen, "Symbol(symbol)");
  await waitForConsoleMessage(screen, `{Symbol(): 42, Symbol(symbol): Symbol()}`);

  message = await waitForConsoleMessage(screen, "{_foo: C{…}, foo: ƒ()}");

  // // TODO: add support for expanding objects in the console
  // await checkMessageObjectContents(
  //   screen,
  //   message,
  //   ['foo: C { baz: "baz" }', 'bar: "bar"', 'baz: "baz"'],
  //   ["foo", "bar"]
  // );

  await warpToMessage(screen, "Done");

  await executeInConsole(screen, "Error('helo')");
  await waitForConsoleMessage(screen, "Error: helo");

  await executeInConsole(screen, 'function f() { throw Error("there"); }()');
  // FIXME the first line in this stack isn't right.
  await waitForConsoleMessage(screen, "Error: there");

  await executeInConsole(screen, "Array(1, 2, 3)");
  message = await waitForConsoleMessage(screen, "(3) [1, 2, 3]");
  // await checkMessageObjectContents(screen, message, ["0: 1", "1: 2", "2: 3", "length: 3"]);

  await executeInConsole(screen, "new Uint8Array([1, 2, 3, 4])");
  message = await waitForConsoleMessage(screen, "Uint8Array(4) [1, 2, 3, 4]");
  // await checkMessageObjectContents(screen, message, ["0: 1", "1: 2", "2: 3", "3: 4", "length: 4"]);

  await executeInConsole(screen, `RegExp("abd", "g")`);
  message = await waitForConsoleMessage(screen, "/abd/g");

  // RegExp object properties are not currently available in chromium.

  // await checkMessageObjectContents(screen, message, ["global: true", `source: "abd"`]);

  await executeInConsole(screen, "new Set([1, 2, 3])");
  message = await waitForConsoleMessage(screen, "Set(3) [1, 2, 3]");
  // await checkMessageObjectContents(screen, message, ["0: 1", "1: 2", "2: 3", "size: 3"], ["<entries>"]);

  await executeInConsole(screen, "new Map([[1, {a:1}], [2, {b:2}]])");
  message = await waitForConsoleMessage(screen, "Map(2) {1 → {…}, 2 → {…}}");
  // await checkMessageObjectContents(
  //   screen,
  //   message,
  //   ["0: 1 → Object { a: 1 }", "1: 2 → Object { b: 2 }", "size: 2"],
  //   ["<entries>"]
  // );

  await executeInConsole(screen, "new WeakSet([{a:1}, {b:2}])");
  message = await waitForConsoleMessage(screen, "WeakSet(2) [{…}, {…}]");
  // await checkMessageObjectContents(
  //   screen,
  //   message,
  //   ["Object { a: 1 }", "Object { b: 2 }"],
  //   ["<entries>"]
  // );

  await executeInConsole(screen, "new WeakMap([[{a:1},{b:1}], [{a:2},{b:2}]])");
  message = await waitForConsoleMessage(screen, "WeakMap(2) {{…} → {…}, {…} → {…}}");
  // await checkMessageObjectContents(
  //   screen,
  //   message,
  //   ["Object { a: 1 } → Object { b: 1 }", "Object { a: 2 } → Object { b: 2 }"],
  //   ["<entries>"]
  // );

  await executeInConsole(screen, "new Promise(() => {})");
  message = await waitForConsoleMessage(screen, "Promise{}");

  // Promise contents aren't currently available in chromium.

  // await checkMessageObjectContents(screen, message, ['"pending"'], []);

  await executeInConsole(screen, "Promise.resolve({ a: 1 })");
  message = await waitForConsoleMessage(screen, "Promise{}");

  // await checkMessageObjectContents(screen, message, ['"fulfilled"', "a: 1"], ["<value>"]);

  await executeInConsole(screen, "Promise.reject({ a: 1 })");
  message = await waitForConsoleMessage(screen, "Promise{}");

  await executeInConsole(screen, "baz");
  message = await waitForConsoleMessage(screen, "ƒbaz()");
  // const text = await message.textContent();
  // checkJumpIcon(screen, text!);
});
