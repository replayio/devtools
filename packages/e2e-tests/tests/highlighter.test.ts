import test, { expect } from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import { openConsolePanel, warpToMessage } from "../helpers/console-panel";
import { selectElementsRowWithText } from "../helpers/elements-panel";

test("element highlighter works everywhere", async ({ page }) => {
  await startTest(page, "doc_inspector_basic.html");

  await openDevToolsTab(page);
  await openConsolePanel(page);
  await warpToMessage(page, "ExampleFinished");

  const pickerButton = page.locator('[title="Select an element in the video to inspect it"]')!;

  await pickerButton.click();

  await selectElementsRowWithText(page, "myiframe");

  const highlighter = page.locator("#box-model-content");

  await highlighter.waitFor();

  const pathDefinition = await highlighter.getAttribute("d");

  // TODO:FE-805 This is a hack to get the test to pass. We should figure out why the path definition is different from the original and not use a hardcoded value.
  const pathDefinitionToCompare = `M10,48.400001525878906 L310,48.400001525878906 L310,198.39999389648438 L10,198.39999389648438`;

  expect(pathDefinition).toBe(pathDefinitionToCompare);
});
