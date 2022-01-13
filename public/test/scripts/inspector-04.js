Test.describe(`Test the rule view`, async () => {
  await Test.selectConsole();
  await Test.warpToMessage("ExampleFinished");

  await Test.selectInspector();

  Test.it(`Check rules for "maindiv" node`, async () => {
    const node = await Test.findMarkupNode("maindiv");
    await Test.selectMarkupNode(node);
    await Test.checkAppliedRules([
      {
        selector: "div::first-letter",
        source: "styles.css:26",
        properties: [{ text: "color: teal;", overridden: false }],
      },
      {
        selector: "element",
        source: "inline",
        properties: [{ text: "background-color: blue;", overridden: false }],
      },
      {
        selector: "body div",
        source: "styles.css:16",
        properties: [
          { text: "background-color: red;", overridden: true },
          { text: "color: black !important;", overridden: false },
        ],
      },
      {
        selector: "div",
        source: "styles.css:21",
        properties: [
          { text: "background-color: black;", overridden: true },
          { text: "color: white !important;", overridden: true },
        ],
      },
      {
        selector: "body",
        source: "styles.css:11",
        properties: [{ text: "font-size: large;", overridden: false }],
      },
    ]);
  });

  Test.it(`Check rules for "conflict" node`, async () => {
    const node = await Test.findMarkupNode("conflict");
    await Test.selectMarkupNode(node);
    await Test.checkAppliedRules([
      {
        selector: "div::first-letter",
        source: "styles.css:26",
        properties: [{ text: "color: teal;", overridden: false }],
      },
      { selector: "element", source: "inline", properties: [] },
      {
        selector: "#conflict",
        source: "styles.css:6",
        properties: [
          { text: "background-color: gray;", overridden: false },
          { text: "font-size: x-large;", overridden: false },
        ],
      },
      {
        selector: "#conflict",
        source: "styles.css:2",
        properties: [{ text: "background-color: blue;", overridden: true }],
      },
      {
        selector: "body div",
        source: "styles.css:16",
        properties: [
          { text: "background-color: red;", overridden: true },
          { text: "color: black !important;", overridden: false },
        ],
      },
      {
        selector: "div",
        source: "styles.css:21",
        properties: [
          { text: "background-color: black;", overridden: true },
          { text: "color: white !important;", overridden: true },
        ],
      },
      {
        selector: "body",
        source: "styles.css:11",
        properties: [{ text: "font-size: large;", overridden: true }],
      },
    ]);
  });

  Test.it(`Check rules for "important" node`, async () => {
    const node = await Test.findMarkupNode("important");
    await Test.selectMarkupNode(node);
    await Test.checkAppliedRules([
      {
        selector: "div::first-letter",
        source: "styles.css:26",
        properties: [{ text: "color: teal;", overridden: false }],
      },
      { selector: "element", source: "inline", properties: [] },
      {
        selector: "#important",
        source: "styles.css:34",
        properties: [{ text: "background-color: black;", overridden: true }],
      },
      {
        selector: "#important",
        source: "styles.css:30",
        properties: [{ text: "background-color: purple !important;", overridden: false }],
      },
      {
        selector: "body div",
        source: "styles.css:16",
        properties: [
          { text: "background-color: red;", overridden: true },
          { text: "color: black !important;", overridden: false },
        ],
      },
      {
        selector: "div",
        source: "styles.css:21",
        properties: [
          { text: "background-color: black;", overridden: true },
          { text: "color: white !important;", overridden: true },
        ],
      },
      {
        selector: "body",
        source: "styles.css:11",
        properties: [{ text: "font-size: large;", overridden: false }],
      },
    ]);
  });
});
