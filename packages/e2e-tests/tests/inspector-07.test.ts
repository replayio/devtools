import test from "@playwright/test";

import { startTest, openDevToolsTab } from "../helpers";
import { openConsolePanel, warpToMessage } from "../helpers/console-panel";
import {
  activateInspectorTool,
  checkComputedStyle,
  searchElementsPanel,
  selectElementsRowWithText,
  selectNextElementsPanelSearchResult,
} from "../helpers/elements-panel";

test("Test that styles for elements can be viewed.", async ({ page }) => {
  await startTest(page, "doc_inspector_shorthand.html");
  await openDevToolsTab(page);
  await openConsolePanel(page);
  await warpToMessage(page, "ExampleFinished");
  await activateInspectorTool(page);

  await selectElementsRowWithText(page, '<div id="first" class="parent">');
  await checkComputedStyle(page, "font-family", "courier", [
    {
      selector: ".parent",
      value: "courier",
      label: "shorthand_styles.css:1",
      url: "http://localhost:8080/test/examples/shorthand_styles.css",
      overridden: false,
    },
  ]);

  await selectElementsRowWithText(page, '<div class="parent"');
  await checkComputedStyle(page, "font-family", "serif", [
    { selector: "this.style", value: "serif", label: "element", url: "#", overridden: false },
    {
      selector: ".parent",
      value: "courier",
      label: "shorthand_styles.css:1",
      url: "http://localhost:8080/test/examples/shorthand_styles.css",
      overridden: true,
    },
  ]);

  await searchElementsPanel(page, "child");
  await checkComputedStyle(page, "font-family", "sans-serif", [
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

  await selectNextElementsPanelSearchResult(page);
  await checkComputedStyle(page, "font-family", "serif", [
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
