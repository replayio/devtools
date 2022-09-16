// Test the objects produced by console.log() calls and by evaluating various
Test.describe(`expressions in the console after time warping.`, async () => {
  await Test.selectConsole();

  // Several objects currently show up differently in chromium.
  const target = await Test.getRecordingTarget();

  await Test.waitForMessage("(20) [0, 1, 2, 3, 4");
  await Test.waitForMessage("Uint8Array(20) [0, 1, 2, 3, 4");
  await Test.waitForMessage("Set(22) [{…}, {…}, 0, 1, 2");
  await Test.waitForMessage("Map(21) {{…} → {…}, 0 → 1, 1 → 2, 2 → 3, 3 → 4");
  await Test.waitForMessage("WeakSet(20) [{…}, {…}, {…},");
  await Test.waitForMessage("WeakMap(20) {{…} → {…}, {…} → {…},");
  await Test.waitForMessage("{a: 0, a0: 0, a1: 1, a2: 2, a3: 3");
  await Test.waitForMessage("/abc/gi");
  await Test.waitForMessage("Fri Aug 19 2022");

  await Test.waitForMessage('RangeError: foo');
  await Test.waitForMessage('<divid="foo"class="bar"style="visibility: visible"blahblah="">');

  msg = await Test.waitForMessage("bar()");
  Test.checkJumpIcon(msg);

  await Test.waitForMessage('(6) [undefined, true, 3, null');
  await Test.waitForMessage('Proxy{}');
  await Test.waitForMessage("Symbol()");
  await Test.waitForMessage("Symbol(symbol)");
  await Test.waitForMessage(`{Symbol(): 42, Symbol(symbol): Symbol()}`);

  msg = await Test.waitForMessage('{_foo: C');

  // TODO (replayio/devtools/pull/7586) This function needs to be rewritten
  // await Test.checkMessageObjectContents(msg, ['_foo: C{baz: "baz"}" }', 'bar: "bar"', 'baz: "baz"'], ["foo", "bar"]);

  await Test.warpToMessage("Done");

  await Test.executeInConsole("Error('helo')");
  await Test.waitForMessage('Error: helo');

  // Defining a new function like this doesn't currently work in chromium.
  if (target == "gecko") {
    await Test.executeInConsole(`
      function f() {
        throw Error("there");
      }
      f();
    `);
    // FIXME the first line in this stack isn't right.
    await Test.waitForMessage('Error: there');
  }

  Test.executeInConsole("Array(1, 2, 3)");
  msg = await Test.waitForMessage("(3) [1, 2, 3]");
  // TODO (replayio/devtools/pull/7586) This function needs to be rewritten
  // await Test.checkMessageObjectContents(msg, ["0: 1", "1: 2", "2: 3", "length: 3"]);

  await Test.executeInConsole("new Uint8Array([1, 2, 3, 4])");
  msg = await Test.waitForMessage("Uint8Array(4) [1, 2, 3, 4]");
  // TODO (replayio/devtools/pull/7586) This function needs to be rewritten
  // await Test.checkMessageObjectContents(msg, ["0: 1", "1: 2", "2: 3", "3: 4", "length: 4"]);

  await Test.executeInConsole(`RegExp("abd", "g")`);
  msg = await Test.waitForMessage("/abd/g");

  // RegExp object properties are not currently available in chromium.
  if (target == "gecko") {
    // TODO (replayio/devtools/pull/7586) This function needs to be rewritten
  // await Test.checkMessageObjectContents(msg, ["global: true", `source: "abd"`]);
  }

  await Test.executeInConsole("new Set([1, 2, 3])");
  msg = await Test.waitForMessage("Set(3) [1, 2, 3]");
  // TODO (replayio/devtools/pull/7586) This function needs to be rewritten
  // await Test.checkMessageObjectContents(msg, ["0: 1", "1: 2", "2: 3", "size: 3"], ["<entries>"]);

  await Test.executeInConsole("new Map([[1, {a:1}], [2, {b:2}]])");
  msg = await Test.waitForMessage("Map(2) {1 → {…}, 2 → {…}}");
  // TODO (replayio/devtools/pull/7586) This function needs to be rewritten
  // await Test.checkMessageObjectContents(
  //   msg,
  //   ["0: 1 → Object { a: 1 }", "1: 2 → Object { b: 2 }", "size: 2"],
  //   ["<entries>"]
  // );

  await Test.executeInConsole("new WeakSet([{a:1}, {b:2}])");
  msg = await Test.waitForMessage("WeakSet(2) [{…}, {…}]");
  // TODO (replayio/devtools/pull/7586) This function needs to be rewritten
  // await Test.checkMessageObjectContents(msg, ["Object { a: 1 }", "Object { b: 2 }"], ["<entries>"]);

  await Test.executeInConsole("new WeakMap([[{a:1},{b:1}], [{a:2},{b:2}]])");
  msg = await Test.waitForMessage("WeakMap(2) {{…} → {…}, {…} → {…}}");
  // TODO (replayio/devtools/pull/7586) This function needs to be rewritten
  // await Test.checkMessageObjectContents(
  //   msg,
  //   ["Object { a: 1 } → Object { b: 1 }", "Object { a: 2 } → Object { b: 2 }"],
  //   ["<entries>"]
  // );

  await Test.executeInConsole("new Promise(() => {})");
  msg = await Test.waitForMessage("Promise{}");

  // Promise contents aren't currently available in chromium.
  if (target == "gecko") {
    // TODO (replayio/devtools/pull/7586) This function needs to be rewritten
    // await Test.checkMessageObjectContents(msg, ['"pending"'], []);
  }

  await Test.clearConsoleEvaluations();

  await Test.executeInConsole("Promise.resolve({ a: 1 })");
  msg = await Test.waitForMessage("Promise{}");

  if (target == "gecko") {
    // TODO (replayio/devtools/pull/7586) This function needs to be rewritten
    // await Test.checkMessageObjectContents(msg, ['"fulfilled"', "a: 1"], ["<value>"]);
  }

  await Test.clearConsoleEvaluations();

  await Test.executeInConsole("Promise.reject({ a: 1 })");
  msg = await Test.waitForMessage("Promise{}");

  if (target == "gecko") {
    // TODO (replayio/devtools/pull/7586) This function needs to be rewritten
    // await Test.checkMessageObjectContents(msg, ['"rejected"', "a: 1"], ["<value>"]);
  }

  await Test.executeInConsole("baz");
  msg = await Test.waitForMessage("baz()");
  Test.checkJumpIcon(msg);
});
