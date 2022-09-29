import test from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import { focusConsoleTextArea, openConsolePanel, warpToMessage } from "../helpers/console-panel";

test(`Test basic breakpoint functionality.`, async ({ page }) => {
  await startTest(page, "doc_rr_objects.html");
  await openDevToolsTab(page);
  await openConsolePanel(page);
  await warpToMessage(page, "Done");

  const textArea = await focusConsoleTextArea(page);

  textArea.fill("A");

  await page.evaluate(() => {
    window.jsterm.showAutocomplete!(true);
  });

  await new Promise(resolve => setTimeout(resolve, 8000));
});
