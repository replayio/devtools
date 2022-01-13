Test.describe(`Test showing both longhand and shorthand properties in rules.`, async () => {
  await Test.selectConsole();
  await Test.warpToMessage("ExampleFinished");

  await Test.selectInspector();

  const node = await Test.findMarkupNode('<div id="first" class="parent">');
  await Test.selectMarkupNode(node);

  await Test.checkAppliedRules([
    {
      selector: ".parent",
      source: "shorthand_styles.css:1",
      properties: [
        { text: "margin-left: 10px;", overridden: false },
        { text: "font: italic small-caps bold 24px courier;", overridden: false },
      ],
    },
  ]);

  Test.setLonghandsExpanded(true);

  await Test.checkAppliedRules([
    {
      selector: ".parent",
      source: "shorthand_styles.css:1",
      properties: [
        { text: "margin-left: 10px;", overridden: false },
        {
          text: "font: italic small-caps bold 24px courier;",
          overridden: false,
          longhandProps: [
            { text: "font-style: italic;", overridden: false },
            { text: "font-variant-caps: small-caps;", overridden: false },
            { text: "font-weight: bold;", overridden: false },
            { text: "font-stretch: normal;", overridden: false },
            { text: "font-size: 24px;", overridden: false },
            { text: "line-height: normal;", overridden: false },
            { text: "font-family: courier;", overridden: false },
            { text: "font-size-adjust: none;", overridden: false },
            { text: "font-kerning: auto;", overridden: false },
            { text: "font-optical-sizing: auto;", overridden: false },
            { text: "font-variant-alternates: normal;", overridden: false },
            { text: "font-variant-east-asian: normal;", overridden: false },
            { text: "font-variant-ligatures: normal;", overridden: false },
            { text: "font-variant-numeric: normal;", overridden: false },
            { text: "font-variant-position: normal;", overridden: false },
            { text: "font-language-override: normal;", overridden: false },
            { text: "font-feature-settings: normal;", overridden: false },
            { text: "font-variation-settings: normal;", overridden: false },
          ],
        },
      ],
    },
  ]);
});
