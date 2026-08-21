import { openDevToolsTab, startTest } from "../helpers";
import { openConsolePanel, warpToMessage } from "../helpers/console-panel";
import {
  activateInspectorTool,
  checkComputedStyle,
  searchElementsPanel,
  selectElementsListRow,
  selectNextElementsPanelSearchResult,
} from "../helpers/elements-panel";
import test, { expect } from "../testFixture";

test.use({ exampleKey: "doc_inspector_shorthand.html" });

// The port in stylesheet URLs comes from whatever dev server recorded the example.
// GitHub Actions replays a pinned recording made on port 8080; Buildkite re-records on port 3000.
const shorthandStylesUrl = expect.stringMatching(
  /^http:\/\/localhost:\d+\/recording\/test\/examples\/shorthand_styles\.css$/
) as unknown as string;

test("inspector-computed-02: Complex computed styles can be viewed", async ({
  pageWithMeta: { page, recordingId, testScope },
  exampleKey,
}) => {
  await startTest(page, recordingId, testScope);
  await openDevToolsTab(page);
  await openConsolePanel(page);
  await warpToMessage(page, "ExampleFinished");
  await activateInspectorTool(page);

  await selectElementsListRow(page, { text: '<div class="parent" id="first">' });
  await checkComputedStyle(page, "font-family", "courier", [
    {
      selector: ".parent",
      value: "courier",
      label: "shorthand_styles.css:1",
      url: shorthandStylesUrl,
      overridden: false,
    },
  ]);

  await selectElementsListRow(page, { text: '<div class="parent" style=' });
  await checkComputedStyle(page, "font-family", "serif", [
    { selector: "this.style", value: "serif", label: "element", url: "#", overridden: false },
    {
      selector: ".parent",
      value: "courier",
      label: "shorthand_styles.css:1",
      url: shorthandStylesUrl,
      overridden: true,
    },
  ]);

  await searchElementsPanel(page, "child");
  await checkComputedStyle(page, "font-family", "sans-serif", [
    {
      selector: ".child",
      value: "sans-serif",
      label: "shorthand_styles.css:6",
      url: shorthandStylesUrl,
      overridden: false,
    },
    {
      selector: ".parent",
      value: "courier",
      label: "shorthand_styles.css:1",
      url: shorthandStylesUrl,
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
      url: shorthandStylesUrl,
      overridden: true,
    },
    { selector: "DIV[1].style", value: "serif", label: "element", url: "#", overridden: true },
    {
      selector: ".parent",
      value: "courier",
      label: "shorthand_styles.css:1",
      url: shorthandStylesUrl,
      overridden: true,
    },
  ]);
});
