Test.describe(`Test basic breakpoint functionality.`, async () => {
  const { addBreakpoint, rewindToLine, resumeToLine, checkEvaluateInTopFrame } = Test;

  await addBreakpoint("doc_rr_basic.html", 21);

  await rewindToLine(21);
  await checkEvaluateInTopFrame("number", 10);
  await rewindToLine(21);
  await checkEvaluateInTopFrame("number", 9);
  await rewindToLine(21);
  await checkEvaluateInTopFrame("number", 8);
  await rewindToLine(21);
  await checkEvaluateInTopFrame("number", 7);
  await rewindToLine(21);
  await checkEvaluateInTopFrame("number", 6);
  await resumeToLine(21);
  await checkEvaluateInTopFrame("number", 7);
  await resumeToLine(21);
  await checkEvaluateInTopFrame("number", 8);
  await resumeToLine(21);
  await checkEvaluateInTopFrame("number", 9);
  await resumeToLine(21);
  await checkEvaluateInTopFrame("number", 10);
});
