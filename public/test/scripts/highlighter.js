Test.describe(`Test that the element highlighter works everywhere.`, async () => {
  await Test.selectInspector();
  await Test.searchMarkup("iframediv");
  await Test.waitForSelectedMarkupNode(`div id="iframediv"`);
  const markupNode = (await Test.findMarkupNode(`div id="iframediv"`)).parentNode;
  await checkHighlighting(markupNode);

  await Test.addBreakpoint("iframe.html", 4);
  await Test.rewindToLine(4);
  const debuggerParentNode = await Test.findScopeNode("div#iframediv");
  const debuggerNode = debuggerParentNode.querySelector(".objectBox-node");
  await checkHighlighting(debuggerNode);

  await Test.selectConsole();
  Test.executeInConsole("elem");
  const consoleNode = await Test.waitForMessage("", ".result .objectBox-node");
  await checkHighlighting(consoleNode);
});

const highlighterShape =
  "M18,56.400001525878906 L302,56.400001525878906 L302,75.60000610351562 L18,75.60000610351562";

async function checkHighlighting(node) {
  Test.dispatchMouseEvent(node, "mouseover");
  await Test.checkHighlighterVisible(true);
  await Test.checkHighlighterShape(highlighterShape);

  Test.dispatchMouseEvent(node, "mouseout");
  await Test.checkHighlighterVisible(false);
}
