Test.describe(`Test that objects show up correctly in the scope pane.`, async () => {
  await Test.warpToMessage("Done");

  // We should be able to expand the window and see its properties.
  await Test.toggleScopeNode("<this>");
  await Test.findScopeNode("bar()");
  await Test.findScopeNode("baz()");
});
