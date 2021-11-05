Test.describe(`showing console objects in node.`, async () => {
  await Test.selectConsole();

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

  msg = await Test.waitForMessage("function bar()");
  Test.checkJumpIcon(msg);

  await Test.waitForMessage('Array(6) [ undefined, true, 3, null, "z", 40n ]');
  await Test.waitForMessage('Proxy {  }');
  await Test.waitForMessage("Symbol()");
  await Test.waitForMessage("Symbol(symbol)");
  await Test.waitForMessage(`Object { "Symbol()": 42, "Symbol(symbol)": "Symbol()" }`);
});
