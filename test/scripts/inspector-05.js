// Test showing rules in source mapped style sheets.
(async function () {
  await Test.start();
  await Test.selectInspector();

  const node = await Test.findMarkupNode("maindiv");
  await Test.selectMarkupNode(node);

  await Test.checkAppliedRules([
    { selector: "element", source: "inline", properties: [] },
    {
      selector: "div",
      source: "styles.css:2",
      properties: [{ text: "background-color: blue;", overridden: false }],
    },
  ]);

  Test.finish();
})();
