import { expect } from "@playwright/test";

import { openDevToolsTab, startTest, test } from "../helpers";
import { findConsoleMessage } from "../helpers/console-panel";
import { addLogpoint } from "../helpers/source-panel";
import { Screen } from "../helpers/types";

async function checkMessageLocation(screen: Screen, text: string, location: string) {
  const message = await findConsoleMessage(screen, text, "log-point");
  const textContent = await message.textContent();
  expect(textContent!.includes(location)).toBeTruthy();
}

test(`Test log point in a sourcemapped file.`, async ({ screen }) => {
  await startTest(screen, "doc_prod_bundle.html");
  await openDevToolsTab(screen);

  // Log point added to line 15 should map to line 15
  await addLogpoint(screen, { lineNumber: 15, url: "bundle_input.js" });
  await checkMessageLocation(screen, "bar 15", "bundle_input.js:15");

  // Log point added to line 17 should map to line 17
  await addLogpoint(screen, { lineNumber: 17, url: "bundle_input.js" });
  await checkMessageLocation(screen, "bar 17", "bundle_input.js:17");
});
