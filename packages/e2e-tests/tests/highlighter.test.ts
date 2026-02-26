import { openDevToolsTab, startTest } from "../helpers";
import { openConsolePanel, warpToMessage } from "../helpers/console-panel";
import { openElementsPanel, selectElementsListRow } from "../helpers/elements-panel";
import test, { expect } from "../testFixture";

test.use({ exampleKey: "doc_inspector_basic.html" });

test("highlighter: element highlighter works everywhere", async ({
  pageWithMeta: { page, recordingId, testScope },
  exampleKey,
}) => {
  await startTest(page, recordingId, testScope);

  await openDevToolsTab(page);
  await openConsolePanel(page);
  await warpToMessage(page, "ExampleFinished");
  await openElementsPanel(page);

  await selectElementsListRow(page, { text: 'iframe id="myiframe"', type: "opening" });

  const highlighter = page.locator("#box-model-content");
  await highlighter.waitFor();

  const pathDefinition = await highlighter.getAttribute("d");

  const normalizedPathDefinition = pathDefinition
    ?.split(" ")
    .map(part => {
      const match = part.match(/^([M|L])(\d+(?:.\d+)?),(\d+(?:.\d+)?)$/);
      // Note(logan): These matches have subpixel values that fluctuate a bit in CI, so for now we force-round them.
      return match ? `${match[1]}${Math.floor(+match[2])},${Math.floor(+match[3])}` : part;
    })
    .join(" ");

  // The important things to check here are 1) the path exists
  // at all (is the box even visible on screen), and 2) is it
  // over the iframe element we're trying to highlight.
  // These coordinates visually match the location of the iframe.
  // Y coordinates differ by 1px between linux (44/198) and mac arm64 (45/199).
  expect(normalizedPathDefinition).toMatch(/^M8,4[45] L312,4[45] L312,19[89] L8,19[89]$/);
});
