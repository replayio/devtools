// TODO fix this test

import {
  test,
  openExample,
  clickDevTools,
  removeAllBreakpoints,
  rewindToLine,
  addBreakpoint,
  resumeToLine,
  waitForConsoleMessage,
  Screen,
} from "../helpers";

async function checkMessageLocation(screen: Screen, text: string, location: string) {
  const msg = await waitForConsoleMessage(screen, text);
  expect(
    msg.querySelector(".frame-link a").innerText == location,
    `Message location should be ${location}`
  );
}

test(`Test breakpoints in a sourcemapped file.`, async ({ screen }) => {
  await openExample(screen, "doc_prod_bundle.html");
  await clickDevTools(screen);
  console.log("Test that the breakpoint added to line 15 maps to line 15");
  await addBreakpoint(screen, "bundle_input.js", 15, undefined, {
    logValue: "'line 15'",
  });
  await checkMessageLocation(screen, "line 15", "bundle_input.js:15");

  console.log("Test that the breakpoint added to line 17 maps to line 17");
  await addBreakpoint(screen, "bundle_input.js", 17, undefined, {
    logValue: "'line 17'",
  });
  await checkMessageLocation(screen, "line 17", "bundle_input.js:17");
});
