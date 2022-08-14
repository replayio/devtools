import { test } from "@playwright/test";
import {
  openExample,
  clickDevTools,
  rewindToLine,
  stepOverToLine,
  stepOutToLine,
  stepInToLine,
  addEventListenerLogpoints,
  addBreakpoint,
  resumeToLine,
  selectConsole,
  warpToMessage,
} from "../helpers";

// Test the objects produced by console.log() calls and by evaluating various
test(`expressions in the console after time warping.`, async ({ page }) => {
  await selectConsole(page);

  await waitForMessage(page, "Array(20) [ 0, 1, 2, 3, 4, 5,");
  await waitForMessage(page, "Uint8Array(20) [ 0, 1, 2, 3, 4, 5,");
  await waitForMessage(page, "Set(22) [ {…}, {…}, 0, 1, 2, 3, 4, 5,");
  await waitForMessage(page, "Map(21) { {…} → {…}, 0 → 1, 1 → 2, 2 → 3, 3 → 4, 4 → 5,");
  await waitForMessage(page, "WeakSet(20) [ {…}, {…}, {…},");
  await waitForMessage(page, "WeakMap(20) { {…} → {…}, {…} → {…},");
  await waitForMessage(page, "Object { a: 0, a0: 0, a1: 1, a2: 2, a3: 3, a4: 4,");
  await waitForMessage(page, "/abc/gi");
  await waitForMessage(page, "Date");

  await waitForMessage(page, 'RangeError: "foo"');
  await waitForMessage(page, '<div id="foo" class="bar" style="visibility: visible" blahblah="">');

  msg = await waitForMessage(page, "function bar()");
  checkJumpIcon(page, msg);

  await waitForMessage(page, 'Array(6) [ undefined, true, 3, null, "z", 40n ]');
  await waitForMessage(page, "Proxy {  }");
  await waitForMessage(page, "Symbol()");
  await waitForMessage(page, "Symbol(symbol)");
  await waitForMessage(page, `Object { "Symbol()": 42, "Symbol(symbol)": "Symbol()" }`);

  msg = await waitForMessage(page, "Object { _foo: C }");
  await checkMessageObjectContents(
    page,
    msg,
    ['foo: C { baz: "baz" }', 'bar: "bar"', 'baz: "baz"'],
    ["foo", "bar"]
  );

  await warpToMessage(page, "Done");

  await executeInConsole(page, "Error('helo')");
  await waitForMessage(page, 'Error: "helo"');

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
  await waitForMessage(page, 'Error: "there"');

  executeInConsole(page, "Array(1, 2, 3)");
  msg = await waitForMessage(page, "Array(3) [ 1, 2, 3 ]");
  await checkMessageObjectContents(page, msg, ["0: 1", "1: 2", "2: 3", "length: 3"]);

  await executeInConsole(page, "new Uint8Array([1, 2, 3, 4])");
  msg = await waitForMessage(page, "Uint8Array(4) [ 1, 2, 3, 4 ]");
  await checkMessageObjectContents(page, msg, ["0: 1", "1: 2", "2: 3", "3: 4", "length: 4"]);

  await executeInConsole(page, `RegExp("abd", "g")`);
  msg = await waitForMessage(page, "/abd/g");

  // RegExp object properties are not currently available in chromium.

  await checkMessageObjectContents(page, msg, ["global: true", `source: "abd"`]);

  await executeInConsole(page, "new Set([1, 2, 3])");
  msg = await waitForMessage(page, "Set(3) [ 1, 2, 3 ]");
  await checkMessageObjectContents(page, msg, ["0: 1", "1: 2", "2: 3", "size: 3"], ["<entries>"]);

  await executeInConsole(page, "new Map([[1, {a:1}], [2, {b:2}]])");
  msg = await waitForMessage(page, "Map { 1 → {…}, 2 → {…} }");
  await checkMessageObjectContents(
    page,
    msg,
    ["0: 1 → Object { a: 1 }", "1: 2 → Object { b: 2 }", "size: 2"],
    ["<entries>"]
  );

  await executeInConsole(page, "new WeakSet([{a:1}, {b:2}])");
  msg = await waitForMessage(page, "WeakSet(2) [ {…}, {…} ]");
  await checkMessageObjectContents(
    page,
    msg,
    ["Object { a: 1 }", "Object { b: 2 }"],
    ["<entries>"]
  );

  await executeInConsole(page, "new WeakMap([[{a:1},{b:1}], [{a:2},{b:2}]])");
  msg = await waitForMessage(page, "WeakMap { {…} → {…}, {…} → {…} }");
  await checkMessageObjectContents(
    page,
    msg,
    ["Object { a: 1 } → Object { b: 1 }", "Object { a: 2 } → Object { b: 2 }"],
    ["<entries>"]
  );

  await executeInConsole(page, "new Promise(() => {})");
  msg = await waitForMessage(page, "Promise {  }");

  // Promise contents aren't currently available in chromium.

  await checkMessageObjectContents(page, msg, ['"pending"'], []);

  await executeInConsole(page, "Promise.resolve({ a: 1 })");
  msg = await waitForMessage(page, "Promise {  }");

  await checkMessageObjectContents(page, msg, ['"fulfilled"', "a: 1"], ["<value>"]);

  await executeInConsole(page, "Promise.reject({ a: 1 })");
  msg = await waitForMessage(page, "Promise {  }");

  await executeInConsole(page, "baz");
  msg = await waitForMessage(page, "function baz()");
  checkJumpIcon(page, msg);
});
