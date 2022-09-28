Test.describe(`Test that the element picker works, and iframe behavior.`, async () => {
  // Events within the iframe should show up.
  await Test.addEventListenerLogpoints(["event.mouse.click"]);
  await Test.waitForMessage(
    "click { target: div#iframediv, clientX: 0, clientY: 0, layerX: 0, layerY: 0 }"
  );

  await Test.addBreakpoint("doc_inspector_basic.html", 9);
  await Test.rewindToLine(9);

  await Test.selectInspector();

  // Pick an element outside the iframe.
  const mainpoint = await Test.getMarkupCanvasCoordinate("maindiv");
  await Test.pickNode(mainpoint.x, mainpoint.y);
  await Test.waitForSelectedMarkupNode(`id="maindiv"`);

  // Pick an element inside the iframe.
  const framepoint = await Test.getMarkupCanvasCoordinate("iframediv", ["myiframe"]);
  await Test.pickNode(framepoint.x, framepoint.y);
  await Test.waitForSelectedMarkupNode(`id="iframediv"`);
});
