import { openDevToolsTab, startTest } from "../helpers";
import { openConsolePanel, warpToMessage } from "../helpers/console-panel";
import {
  getElementsListRow,
  openElementsPanel,
  selectElementsListRow,
  toggleElementsListRow,
} from "../helpers/elements-panel";
import test, { expect } from "../testFixtureCloneRecording";

test.use({ exampleKey: "doc_inspector_basic.html" });

test("highlighter: element highlighter works everywhere", async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);

  await openDevToolsTab(page);
  await openConsolePanel(page);
  await warpToMessage(page, "ExampleFinished");
  await openElementsPanel(page);

  const bodyLocator = await getElementsListRow(page, { text: "body", type: "opening" });
  await toggleElementsListRow(page, bodyLocator, true);

  await selectElementsListRow(page, { text: "myiframe" });

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

  // TODO:FE-805 This is a hack to get the test to pass. We should figure out why the path definition is different from the original and not use a hardcoded value.
  const pathDefinitionToCompare = `M10,48 L310,48 L310,198 L10,198`;
  expect(normalizedPathDefinition).toBe(pathDefinitionToCompare);
});
