Test.describe(`Test showing both longhand and shorthand properties in rules.`, async () => {
  await Test.selectInspector();

  let node = await Test.findMarkupNode('<div id="first" class="parent">');
  await Test.toggleMarkupNode(node);
  await Test.checkComputedStyle("font-family", "courier", [
    {
      selector: ".parent",
      value: "courier",
      label: "shorthand_styles.css:1",
      url: "http://localhost:8080/test/examples/shorthand_styles.css",
      overridden: false,
    },
  ]);

  node = await Test.findMarkupNode('<div id="second" class="child">');
  node.click();
  await Test.checkComputedStyle("font-family", "sans-serif", [
    {
      selector: ".child",
      value: "sans-serif",
      label: "shorthand_styles.css:6",
      url: "http://localhost:8080/test/examples/shorthand_styles.css",
      overridden: false,
    },
    {
      selector: ".parent",
      value: "courier",
      label: "shorthand_styles.css:1",
      url: "http://localhost:8080/test/examples/shorthand_styles.css",
      overridden: true,
    },
  ]);

  node = await Test.findMarkupNode('<div class="parent"');
  await Test.toggleMarkupNode(node);
  await Test.checkComputedStyle("font-family", "serif", [
    { selector: "this.style", value: "serif", label: "element", url: "#", overridden: false },
    {
      selector: ".parent",
      value: "courier",
      label: "shorthand_styles.css:1",
      url: "http://localhost:8080/test/examples/shorthand_styles.css",
      overridden: true,
    },
  ]);

  node = await Test.findMarkupNode('<div class="child"');
  node.click();
  await Test.checkComputedStyle("font-family", "serif", [
    { selector: "this.style", value: "unset", label: "element", url: "#", overridden: false },
    {
      selector: ".child",
      value: "sans-serif",
      label: "shorthand_styles.css:6",
      url: "http://localhost:8080/test/examples/shorthand_styles.css",
      overridden: true,
    },
    { selector: "DIV[1].style", value: "serif", label: "element", url: "#", overridden: true },
    {
      selector: ".parent",
      value: "courier",
      label: "shorthand_styles.css:1",
      url: "http://localhost:8080/test/examples/shorthand_styles.css",
      overridden: true,
    },
  ]);
});
