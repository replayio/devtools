// Test that the element highlighter works, and iframe behavior.
(async function() {
  // Events within the iframe should show up.
  await Test.addEventListenerLogpoints(["event.mouse.click"]);
  await Test.waitForMessage("click { target: div#iframediv, clientX: 0, clientY: 0, layerX: 0, layerY: 0 }");

  await Test.addBreakpoint("doc_inspector_basic.html", 9);
  await Test.rewindToLine(9);

  await Test.selectInspector();

  const { x, y } = await Test.getMarkupCanvasCoordinate("maindiv");
  await Test.pickNode(x, y);

  await Test.waitForSelectedMarkupNode(`id="maindiv"`);

  Test.finish();
})();
