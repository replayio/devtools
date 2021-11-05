Test.describe(
  `Test which message is the paused one after warping, stepping, and evaluating.`,
  async () => {
    await Test.selectConsole();

    // When warping to a message, it is the paused one.
    await Test.warpToMessage("number: 2");
    await Test.checkPausedMessage("number: 2");

    await Test.stepOverToLine(20);
    await Test.checkPausedMessage("number: 2");

    // When stepping back we end up earlier than the console call, even though we're
    // paused at the same line. This isn't ideal.
    await Test.reverseStepOverToLine(19);
    await Test.checkPausedMessage("number: 1");

    await Test.warpToMessage("number: 2");
    await Test.checkPausedMessage("number: 2");

    await Test.stepOverToLine(20);
    await Test.checkPausedMessage("number: 2");

    await Test.executeInConsole("1 << 5");
    await Test.checkPausedMessage("number: 2");

    await Test.stepOverToLine(21);
    await Test.checkPausedMessage("number: 2");

    await Test.executeInConsole("1 << 7");
    await Test.checkPausedMessage("number: 2");

    await Test.reverseStepOverToLine(20);
    await Test.checkPausedMessage("number: 2");

    await Test.executeInConsole("1 << 6");
    await Test.checkPausedMessage("number: 2");

    await Test.stepOverToLine(21);
    await Test.checkPausedMessage("number: 2");

    await Test.stepOverToLine(22);
    await Test.checkPausedMessage("number: 3");
  }
);
