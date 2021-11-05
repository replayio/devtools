// Test expanding console objects that were logged by console messages,
Test.describe(`logpoints, and evaluations when the debugger is somewhere else.`, async () => {
  await Test.selectConsole();

  // Several objects in this test show less information when previewed in chromium vs. gecko.
  // This would be nice to fix.
  const target = await Test.getRecordingTarget();

  let msg;

  msg = await Test.waitForMessage("Iteration 3");
  await Test.checkMessageObjectContents(
    msg,
    ["subobj: Object { subvalue: 9 }"],
    [target == "gecko" ? "obj: Object { value: 6, subobj: {…} }" : "obj: Object { … }"]
  );

  msg = await Test.waitForMessage("Iteration 5");
  await Test.checkMessageObjectContents(
    msg,
    ["subobj: Object { subvalue: 15 }"],
    [target == "gecko" ? "obj: Object { value: 10, subobj: {…} }" : "obj: Object { … }"]
  );

  msg = await Test.waitForMessage("Iteration 7");
  await Test.checkMessageObjectContents(
    msg,
    ["subobj: Object { subvalue: 21 }"],
    [target == "gecko" ? "obj: Object { value: 14, subobj: {…} }" : "obj: Object { … }"]
  );

  msg.querySelector(".frame-link a").click();
  await Test.waitUntil(() => Test.dbgSelectors.getSelectedLocation()?.line == 15);

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
    [target == "gecko" ? "subobj: Object { subvalue: 0 }" : "subobj: Object { … }"],
    ["obj: Object { value: 0, subobj: {…} }"]
  );
});
