Test.describe(`Test stepping in blackboxed sources.`, async () => {
  // Stepping forward while in a blackboxed source should act like a step out.
  await Test.addBreakpoint("blackbox.js", 3);
  await Test.rewindToLine(3);
  await Test.toggleBlackboxSelectedSource();
  await Test.stepOverToLine(20); // doc_rr_blackbox.html

  // Unblackbox the source.
  await Test.selectSource("blackbox.js");
  await Test.toggleBlackboxSelectedSource();

  // Stepping backward while in a blackboxed source should act like a reverse step out.
  await Test.rewindToLine(3); // blackbox.js
  await Test.toggleBlackboxSelectedSource();
  await Test.reverseStepOverToLine(15); // doc_rr_blackbox.html

  // Stepping forward out of a call from a blackboxed source should step out to the
  // non-blackboxed caller.
  await Test.addBreakpoint("doc_rr_blackbox.html", 17);
  await Test.resumeToLine(17);
  await Test.stepOverToLine(17);
  await Test.stepOverToLine(20);

  // Stepping backward out of a call from a blackboxed source should reverse step out
  // to the non-blackboxed caller.
  await Test.rewindToLine(17);
  await Test.reverseStepOverToLine(15);
});
