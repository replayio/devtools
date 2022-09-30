import test, { expect } from "@playwright/test";

import { openDevToolsTab, startTest, selectNodePicker } from "../helpers";
import { openConsolePanel, warpToMessage } from "../helpers/console-panel";

test("element highlighter works everywhere", async ({ page }) => {
  await startTest(page, "doc_inspector_basic.html");

  await openDevToolsTab(page);
  await openConsolePanel(page);
  await warpToMessage(page, "ExampleFinished");

  await selectNodePicker(page);

  await page.waitForSelector(`[data-value="myiframe"]`);

  const markupNode = await page.locator(`[data-value="myiframe"]`);

  await markupNode.click();

  const highlighter = page.locator("#box-model-content");

  await highlighter.waitFor();

  const pathDefinition = await highlighter.getAttribute("d");

  const pathDefinitionToCompare = `M10,48.400001525878906 L310,48.400001525878906 L310,198.39999389648438 L10,198.39999389648438`;

  expect(pathDefinition).toBe(pathDefinitionToCompare);
});
