import test from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import { openSource } from "../helpers/source-explorer-panel";
import { getCommandKey } from "../helpers/utils";

test("quick_open_modal-01: Test basic searching functionality", async ({ page }) => {
  await startTest(page, "node/basic.js");
  await openDevToolsTab(page);

  await openSource(page, "basic.js");

  await page.keyboard.press(`${getCommandKey()}+Shift+O`);
  await page.focus('[data-test-id="QuickOpenInput"]');

  await page.keyboard.type("bar");

  const sourceRow = await page.waitForSelector(
    '[data-test-id="QuickOpenResultsList"]:has-text("bar")'
  );

  sourceRow.click();

  await page.waitForSelector(
    `[data-test-id="SourceLine-8"]>[data-test-name="ViewSourceHighlight"]`
  );
});
