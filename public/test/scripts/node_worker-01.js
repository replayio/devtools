Test.describe(`make sure node workers don't cause crashes.`, async () => {
  await Test.selectConsole();

  await Test.warpToMessage("GotWorkerMessage pong");
  await Test.stepOverToLine(18);

  await Test.addBreakpoint("run_worker.js", 13);
  await Test.rewindToLine(13);

  await Test.addBreakpoint("run_worker.js", 6);
  await Test.rewindToLine(6);
});
