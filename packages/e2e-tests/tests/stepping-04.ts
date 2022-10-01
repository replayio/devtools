import test from "@playwright/test";

// TODO [FE-626]
test.skip(`Test stepping in blackboxed sources`, async ({ page }) => {
  // This test is disabled because we removed blackboxing during the codebase
  // cleanup in summer 2022. If we ever reimplement blackboxing, we should
  // reimplement this test appropriately.
  // TODO Re-enable blackboxing
  /*
  // Stepping forward while in a blackboxed source should act like a step out.
  await Test.addBreakpoint("blackbox.js", 3);
  await Test.rewindToLine(3);
  await Test.toggleBlackboxSelectedSource();
  await Test.stepOverToLine(20); // doc_rr_blackbox.html

  // Unblackbox the source.
  await Test.openSource("blackbox.js");
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
  */
});
