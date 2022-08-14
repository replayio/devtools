// TODO fix this test

import { test, Page, expect } from "@playwright/test";

import {
  openExample,
  clickDevTools,
  removeAllBreakpoints,
  rewindToLine,
  addBreakpoint,
  resumeToLine,
  waitForConsoleMessage,
} from "../helpers";

async function checkMessageLocation(page: Page, text: string, location: string) {
  const msg = await waitForConsoleMessage(page, text);
  expect(
    msg.querySelector(".frame-link a").innerText == location,
    `Message location should be ${location}`
  );
}

test(`Test breakpoints in a sourcemapped file.`, async ({ page }) => {
  await openExample(page, "doc_prod_bundle.html");
  await clickDevTools(page);
  console.log("Test that the breakpoint added to line 15 maps to line 15");
  await addBreakpoint(page, "bundle_input.js", 15, undefined, {
    logValue: "'line 15'",
  });
  await checkMessageLocation(page, "line 15", "bundle_input.js:15");

  console.log("Test that the breakpoint added to line 17 maps to line 17");
  await addBreakpoint(page, "bundle_input.js", 17, undefined, {
    logValue: "'line 17'",
  });
  await checkMessageLocation(page, "line 17", "bundle_input.js:17");
});
