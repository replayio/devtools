// Test that workers function when recording/replaying. For now workers can't
// be inspected, so we're making sure that nothing crashes.
(async function() {
  await Test.addBreakpoint("doc_rr_worker.html", 15);
  await Test.rewindToLine(15);

  Test.finish();
})();
