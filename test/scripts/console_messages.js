// Test expanding console objects that were logged by console messages,
// logpoints, and evaluations when the debugger is somewhere else.
(async function () {
  await Test.selectConsole();

  let msg;

  msg = await Test.waitForMessage("Iteration 3");
  await Test.checkMessageObjectContents(
    msg,
    ["subobj: Object { subvalue: 9 }"],
    ["obj: Object { value: 6, subobj: {…} }"]
  );

  msg = await Test.waitForMessage("Iteration 5");
  await Test.checkMessageObjectContents(
    msg,
    ["subobj: Object { subvalue: 15 }"],
    ["obj: Object { value: 10, subobj: {…} }"]
  );

  msg = await Test.waitForMessage("Iteration 7");
  await Test.checkMessageObjectContents(
    msg,
    ["subobj: Object { subvalue: 21 }"],
    ["obj: Object { value: 14, subobj: {…} }"]
  );

  Test.clickMessageLocationLink(msg)
  await Test.waitUntil(() => Test.dbgSelectors.getSelectedLocation()?.line == 15)

  await Test.addBreakpoint("doc_rr_console.html", 16, undefined, {
    logValue: `"Logpoint " + iteration, object`,
  });

  msg = await Test.waitForMessage("Logpoint 8");
  await Test.checkMessageObjectContents(
    msg,
    // Disabled due to https://github.com/RecordReplay/devtools/issues/476
    //["subobj: Object { subvalue: 24 }"],
    ["subobj: Object"],
    ["obj: Object { value: 16, subobj: {…} }"]
  );

  await Test.removeAllBreakpoints();
  await Test.addBreakpoint("doc_rr_console.html", 11);
  await Test.rewindToLine(11);

  await Test.executeInConsole("object");
  await Test.warpToMessage("Iteration 3");

  msg = await Test.waitForMessage("Object { obj: {…}, value: 0 }");
  await Test.checkMessageObjectContents(
    msg,
    ["subobj: Object { subvalue: 0 }"],
    ["obj: Object { value: 0, subobj: {…} }"]
  );

  Test.finish();
})();
