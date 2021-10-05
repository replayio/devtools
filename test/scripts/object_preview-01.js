// Test the objects produced by console.log() calls and by evaluating various
Test.describe(`expressions in the console after time warping.`, async () => {
  await Test.selectConsole();

  // Several objects currently show up differently in chromium.
  const target = await Test.getRecordingTarget();

  await Test.waitForMessage("Array(20) [ 0, 1, 2, 3, 4, 5,");
  await Test.waitForMessage("Uint8Array(20) [ 0, 1, 2, 3, 4, 5,");
  await Test.waitForMessage("Set(22) [ {…}, {…}, 0, 1, 2, 3, 4, 5,");
  await Test.waitForMessage("Map(21) { {…} → {…}, 0 → 1, 1 → 2, 2 → 3, 3 → 4, 4 → 5,");
  await Test.waitForMessage("WeakSet(20) [ {…}, {…}, {…},");
  await Test.waitForMessage("WeakMap(20) { {…} → {…}, {…} → {…},");
  await Test.waitForMessage("Object { a: 0, a0: 0, a1: 1, a2: 2, a3: 3, a4: 4,");
  await Test.waitForMessage("/abc/gi");
  await Test.waitForMessage("Date");

  await Test.waitForMessage('RangeError: "foo"');
  await Test.waitForMessage(
    target == "gecko"
    ? '<div id="foo" class="bar" style="visibility: visible" blahblah="">'
    : "HTMLDivElement"
  );

  msg = await Test.waitForMessage("function bar()");
  Test.checkJumpIcon(msg);

  await Test.waitForMessage('Array(6) [ undefined, true, 3, null, "z", 40n ]');
  await Test.waitForMessage('Proxy {  }');
  await Test.waitForMessage("Symbol()");
  await Test.waitForMessage("Symbol(symbol)");
  await Test.waitForMessage(`Object { "Symbol()": 42, "Symbol(symbol)": "Symbol()" }`);

  await Test.warpToMessage("Done");

  await Test.executeInConsole("Error('helo')");
  await Test.waitForMessage('Error: "helo"');

  // Defining a new function like this doesn't currently work in chromium.
  if (target == "gecko") {
    await Test.executeInConsole(`
      function f() {
        throw Error("there");
      }
      f();
    `);
    // FIXME the first line in this stack isn't right.
    await Test.waitForMessage('Error: "there"');
  }

  Test.executeInConsole("Array(1, 2, 3)");
  msg = await Test.waitForMessage("Array(3) [ 1, 2, 3 ]");
  await Test.checkMessageObjectContents(msg, ["0: 1", "1: 2", "2: 3", "length: 3"]);

  await Test.executeInConsole("new Uint8Array([1, 2, 3, 4])");
  msg = await Test.waitForMessage("Uint8Array(4) [ 1, 2, 3, 4 ]");
  await Test.checkMessageObjectContents(msg, ["0: 1", "1: 2", "2: 3", "3: 4", "length: 4"]);

  await Test.executeInConsole(`RegExp("abd", "g")`);
  msg = await Test.waitForMessage("/abd/g");

  // RegExp object properties are not currently available in chromium.
  if (target == "gecko") {
    await Test.checkMessageObjectContents(msg, ["global: true", `source: "abd"`]);
  }

  await Test.executeInConsole("new Set([1, 2, 3])");
  msg = await Test.waitForMessage("Set(3) [ 1, 2, 3 ]");
  await Test.checkMessageObjectContents(msg, ["0: 1", "1: 2", "2: 3", "size: 3"], ["<entries>"]);

  await Test.executeInConsole("new Map([[1, {a:1}], [2, {b:2}]])");
  msg = await Test.waitForMessage("Map { 1 → {…}, 2 → {…} }");
  await Test.checkMessageObjectContents(
    msg,
    ["0: 1 → Object { a: 1 }", "1: 2 → Object { b: 2 }", "size: 2"],
    ["<entries>"]
  );

  await Test.executeInConsole("new WeakSet([{a:1}, {b:2}])");
  msg = await Test.waitForMessage("WeakSet(2) [ {…}, {…} ]");
  await Test.checkMessageObjectContents(msg, ["Object { a: 1 }", "Object { b: 2 }"], ["<entries>"]);

  await Test.executeInConsole("new WeakMap([[{a:1},{b:1}], [{a:2},{b:2}]])");
  msg = await Test.waitForMessage("WeakMap { {…} → {…}, {…} → {…} }");
  await Test.checkMessageObjectContents(
    msg,
    ["Object { a: 1 } → Object { b: 1 }", "Object { a: 2 } → Object { b: 2 }"],
    ["<entries>"]
  );

  await Test.executeInConsole("new Promise(() => {})");
  msg = await Test.waitForMessage("Promise {  }");

  // Promise contents aren't currently available in chromium.
  if (target == "gecko") {
    await Test.checkMessageObjectContents(msg, ['"pending"'], []);
  }

  await Test.executeInConsole("Promise.resolve({ a: 1 })");
  msg = await Test.waitForMessage("Promise {  }");

  if (target == "gecko") {
    await Test.checkMessageObjectContents(msg, ['"fulfilled"', "a: 1"], ["<value>"]);
  }

  await Test.executeInConsole("Promise.reject({ a: 1 })");
  msg = await Test.waitForMessage("Promise {  }");

  if (target == "gecko") {
    await Test.checkMessageObjectContents(msg, ['"rejected"', "a: 1"], ["<value>"]);
  }

  await Test.executeInConsole("baz");
  msg = await Test.waitForMessage("function baz()");
  Test.checkJumpIcon(msg);
});
