import test, { Page, expect } from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import { findConsoleMessage } from "../helpers/console-panel";
import { addLogpoint } from "../helpers/source-panel";

async function checkMessageLocation(page: Page, text: string, location: string) {
  const message = await findConsoleMessage(page, text, "log-point");
  const textContent = await message.textContent();
  expect(textContent!.includes(location)).toBeTruthy();
}

test(`breakpoints-06: Test log point in a sourcemapped file`, async ({ page }) => {
  await startTest(page, "doc_prod_bundle.html");
  await openDevToolsTab(page);

  // Log point added to line 15 should map to line 15
  await addLogpoint(page, { lineNumber: 15, url: "bundle_input.js" });
  await checkMessageLocation(page, "bar 15", "bundle_input.js:15");

  // Log point added to line 17 should map to line 17
  await addLogpoint(page, { lineNumber: 17, url: "bundle_input.js" });
  await checkMessageLocation(page, "bar 17", "bundle_input.js:17");
});
