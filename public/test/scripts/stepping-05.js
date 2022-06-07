Test.describe(`Test stepping in pretty-printed code.`, async () => {
  await Test.addBreakpoint("bundle_input.js", 4);
  await Test.rewindToLine(4);
  await Test.stepInToLine(1);

  await Test.addBreakpoint("doc_minified.html", 8);
  await Test.resumeToLine(8);

  await Test.stepOverToLine(8);
  await Test.stepOverToLine(9);

  await Test.selectConsole();
  await Test.addEventListenerLogpoints(["event.mouse.click"]);

  await Test.warpToMessage("click");
  await Test.selectDebugger();

  await Test.stepInToLine(1);
  await Test.stepOutToLine(10);
  await Test.stepInToLine(6);
  await Test.stepOutToLine(10);
  await Test.stepInToLine(2);
  await Test.stepOutToLine(10);
});
