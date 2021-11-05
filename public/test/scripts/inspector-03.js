Test.describe(`Test that styles for elements can be viewed.`, async () => {
  await Test.selectInspector();

  let node;

  node = await Test.findMarkupNode("body");
  await Test.selectMarkupNode(node);
  await Test.checkComputedStyle("background-color", "rgb(0, 128, 0)");

  node = await Test.findMarkupNode("maindiv");
  await Test.selectMarkupNode(node);
  await Test.checkComputedStyle("background-color", "rgb(0, 0, 255)");

  await Test.addBreakpoint("doc_inspector_styles.html", 11);
  await Test.rewindToLine(11);

  node = await Test.findMarkupNode("maindiv");
  await Test.selectMarkupNode(node);
  await Test.checkComputedStyle("background-color", "rgb(255, 0, 0)");
});
