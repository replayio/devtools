// Test basic inspector functionality: the inspector is able to
Test.describe(`show contents when paused according to the child's current position.`, async () => {
  await Test.selectInspector();

  let node;

  node = await Test.findMarkupNode(`div id="maindiv" style="color: red"`);
  await Test.toggleMarkupNode(node);
  await Test.findMarkupNode("GOODBYE");

  await Test.addBreakpoint("doc_inspector_basic.html", 9);
  await Test.rewindToLine(9);

  node = await Test.findMarkupNode(`div id="maindiv" style="color: red"`);
  await Test.toggleMarkupNode(node);
  await Test.findMarkupNode("HELLO");

  await Test.searchMarkup("STUFF");
  await Test.waitForSelectedMarkupNode("STUFF");

  await Test.searchMarkup();
  await Test.waitForSelectedMarkupNode(`div id="div4" some-attribute="STUFF"`);
});
