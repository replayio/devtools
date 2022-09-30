import test from "@playwright/test";

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

  await page.pause();
});
