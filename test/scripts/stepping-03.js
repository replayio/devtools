Test.describe(
  `Stepping past the beginning or end of a frame should act like a step-out.`,
  async () => {
    await Test.addBreakpoint("doc_rr_basic.html", 20);
    await Test.rewindToLine(20);
    await Test.checkEvaluateInTopFrame("number", 10);
    await Test.reverseStepOverToLine(19);
    await Test.reverseStepOverToLine(11);

    // After reverse-stepping out of the topmost frame we should rewind to the
    // last breakpoint hit.
    await Test.reverseStepOverToLine(20);
    await Test.checkEvaluateInTopFrame("number", 9);

    await Test.stepOverToLine(21);
    await Test.stepOverToLine(22);
    await Test.stepOverToLine(12);
    await Test.stepOverToLine(16);
    await Test.stepOverToLine(17);

    // After forward-stepping out of the topmost frame we should run forward to
    // the next breakpoint hit.
    await Test.stepOverToLine(20);
    await Test.checkEvaluateInTopFrame("number", 10);
  }
);
