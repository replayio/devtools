Test.describe(`showing console objects in node.`, async () => {
  await Test.selectConsole();

  await Test.waitForMessage("Array(20) [0, 1, 2, 3, 4,");
  await Test.waitForMessage("Uint8Array(20) [0, 1, 2, 3, 4,");
  await Test.waitForMessage("Set(22) [{…}, {…}, 0, 1, 2,");
  await Test.waitForMessage("Map(21) {{…} → {…}, 0 → 1, 1 → 2, 2 → 3, 3 → 4,");
  await Test.waitForMessage("WeakSet(20) [{…}, {…}, {…},");
  await Test.waitForMessage("WeakMap(20) {{…} → {…}, {…} → {…},");
  await Test.waitForMessage("{a: 0, a0: 0, a1: 1, a2: 2, a3: 3,");
  await Test.waitForMessage("/abc/gi");
  await Test.waitForMessage("Tue Aug 23 2022");

  await Test.waitForMessage('RangeError: foo');

  msg = await Test.waitForMessage("bar()");
  Test.checkJumpIcon(msg);

  await Test.waitForMessage('Array(6) [undefined, true, 3, null, "z",');
  await Test.waitForMessage('Proxy');
  await Test.waitForMessage("Symbol()");
  await Test.waitForMessage("Symbol(symbol)");
  await Test.waitForMessage(`{Symbol(): 42, Symbol(symbol): Symbol()}`);
});
