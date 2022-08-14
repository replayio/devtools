import { test } from "@playwright/test";
import {
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
test(`expressions in the console after time warping.`, async ({ page }) => {
  let msg;
  await openExample(page, "doc_rr_objects.html");
  await clickDevTools(page);
  await selectConsole(page);

  await waitForConsoleMessage(page, "Array(20) [ 0, 1, 2, 3, 4, 5,");
  await waitForConsoleMessage(page, "Uint8Array(20) [ 0, 1, 2, 3, 4, 5,");
  await waitForConsoleMessage(page, "Set(22) [ {…}, {…}, 0, 1, 2, 3, 4, 5,");

  await waitForConsoleMessage(page, "Map(21) { {…} → {…}, 0 → 1, 1 → 2, 2 → 3, 3 → 4, 4 → 5,");
  await waitForConsoleMessage(page, "WeakSet(20) [ {…}, {…}, {…},");
  await waitForConsoleMessage(page, "WeakMap(20) { {…} → {…}, {…} → {…},");
  await waitForConsoleMessage(page, "Object { a: 0, a0: 0, a1: 1, a2: 2, a3: 3, a4: 4,");
  await waitForConsoleMessage(page, "/abc/gi");
  await waitForConsoleMessage(page, "Date");

  await waitForConsoleMessage(page, `RangeError: "foo"`);
  await waitForConsoleMessage(
    page,
    '<div id="foo" class="bar" style="visibility: visible" blahblah="">'
  );

  await waitForConsoleMessage(page, "function bar()");
  await checkJumpIcon(page, "function bar()");
  // await new Promise(r => setTimeout(r, 100_000));

  await waitForConsoleMessage(page, 'Array(6) [ undefined, true, 3, null, "z", 40n ]');
  await waitForConsoleMessage(page, "Proxy {  }");
  await waitForConsoleMessage(page, "Symbol()");
  await waitForConsoleMessage(page, "Symbol(symbol)");
  await waitForConsoleMessage(page, `Object { "Symbol()": 42, "Symbol(symbol)": "Symbol()" }`);

  msg = await waitForConsoleMessage(page, "Object { _foo: C }");

  // TODO: add support for expanding objects in the console
  await checkMessageObjectContents(
    page,
    msg,
    ['foo: C { baz: "baz" }', 'bar: "bar"', 'baz: "baz"'],
    ["foo", "bar"]
  );

  await warpToMessage(page, "Done");

  await executeInConsole(page, "Error('helo')");
  await waitForConsoleMessage(page, 'Error: "helo"');

  await executeInConsole(
    page,
    `
        function f() {
          throw Error("there");
        }
        f();
      `
  );
  // FIXME the first line in this stack isn't right.
  await waitForConsoleMessage(page, 'Error: "there"');

  executeInConsole(page, "Array(1, 2, 3)");
  msg = await waitForConsoleMessage(page, "Array(3) [ 1, 2, 3 ]");
  await checkMessageObjectContents(page, msg, ["0: 1", "1: 2", "2: 3", "length: 3"]);

  await executeInConsole(page, "new Uint8Array([1, 2, 3, 4])");
  msg = await waitForConsoleMessage(page, "Uint8Array(4) [ 1, 2, 3, 4 ]");
  await checkMessageObjectContents(page, msg, ["0: 1", "1: 2", "2: 3", "3: 4", "length: 4"]);

  await executeInConsole(page, `RegExp("abd", "g")`);
  msg = await waitForConsoleMessage(page, "/abd/g");

  // RegExp object properties are not currently available in chromium.

  await checkMessageObjectContents(page, msg, ["global: true", `source: "abd"`]);

  await executeInConsole(page, "new Set([1, 2, 3])");
  msg = await waitForConsoleMessage(page, "Set(3) [ 1, 2, 3 ]");
  await checkMessageObjectContents(page, msg, ["0: 1", "1: 2", "2: 3", "size: 3"], ["<entries>"]);

  await executeInConsole(page, "new Map([[1, {a:1}], [2, {b:2}]])");
  msg = await waitForConsoleMessage(page, "Map { 1 → {…}, 2 → {…} }");
  await checkMessageObjectContents(
    page,
    msg,
    ["0: 1 → Object { a: 1 }", "1: 2 → Object { b: 2 }", "size: 2"],
    ["<entries>"]
  );

  await executeInConsole(page, "new WeakSet([{a:1}, {b:2}])");
  msg = await waitForConsoleMessage(page, "WeakSet(2) [ {…}, {…} ]");
  await checkMessageObjectContents(
    page,
    msg,
    ["Object { a: 1 }", "Object { b: 2 }"],
    ["<entries>"]
  );

  await executeInConsole(page, "new WeakMap([[{a:1},{b:1}], [{a:2},{b:2}]])");
  msg = await waitForConsoleMessage(page, "WeakMap { {…} → {…}, {…} → {…} }");
  await checkMessageObjectContents(
    page,
    msg,
    ["Object { a: 1 } → Object { b: 1 }", "Object { a: 2 } → Object { b: 2 }"],
    ["<entries>"]
  );

  await executeInConsole(page, "new Promise(() => {})");
  msg = await waitForConsoleMessage(page, "Promise {  }");

  // Promise contents aren't currently available in chromium.

  await checkMessageObjectContents(page, msg, ['"pending"'], []);

  await executeInConsole(page, "Promise.resolve({ a: 1 })");
  msg = await waitForConsoleMessage(page, "Promise {  }");

  await checkMessageObjectContents(page, msg, ['"fulfilled"', "a: 1"], ["<value>"]);

  await executeInConsole(page, "Promise.reject({ a: 1 })");
  msg = await waitForConsoleMessage(page, "Promise {  }");

  await executeInConsole(page, "baz");
  msg = await waitForConsoleMessage(page, "function baz()");
  checkJumpIcon(page, msg);
});
