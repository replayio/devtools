// Test interaction of breakpoints with debugger statements.
(async function () {
  await Test.start();
  await Test.rewindToLine(9);
  await Test.addBreakpoint("doc_debugger_statements.html", 8);
  await Test.rewindToLine(8);
  await Test.resumeToLine(9);
  await Test.removeAllBreakpoints();
  await Test.rewindToLine(7);
  await Test.resumeToLine(9);

  Test.finish();
})();
