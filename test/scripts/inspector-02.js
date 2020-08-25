// Test that the element highlighter works.
(async function() {
  await Test.addBreakpoint("doc_inspector_basic.html", 9);
  await Test.rewindToLine(9);

  await Test.selectInspector();

  const { x, y } = await Test.getMarkupCanvasCoordinate("maindiv");
  await Test.pickNode(x, y);

  await Test.waitForSelectedMarkupNode(`id="maindiv"`);

  Test.finish();
})();
