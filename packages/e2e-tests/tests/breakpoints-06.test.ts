import {
  addLogpoint,
  clickDevTools,
  getConsoleMessage,
  openExample,
  test,
  Screen,
} from "../helpers";

async function checkMessageLocation(screen: Screen, text: string, location: string) {
  const message = await getConsoleMessage(screen, text, "log-point");
  const textContent = await message.textContent();
  expect(textContent!.includes(location)).toBeTruthy();
}

test(`Test breakpoints in a sourcemapped file.`, async ({ screen }) => {
  await openExample(screen, "doc_prod_bundle.html");
  await clickDevTools(screen);

  console.log("Test that the breakpoint added to line 15 maps to line 15");
  await addLogpoint(screen, { lineNumber: 15, url: "bundle_input.js" });
  await checkMessageLocation(screen, "line 15", "bundle_input.js:15");

  console.log("Test that the breakpoint added to line 17 maps to line 17");
  await addLogpoint(screen, { lineNumber: 17, url: "bundle_input.js" });
  await checkMessageLocation(screen, "line 17", "bundle_input.js:17");
});
