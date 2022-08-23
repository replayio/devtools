async function checkMessageLocation(text, location) {
  await Test.waitForMessage(text);

  // TODO This recording doesn't actually have any sources (at least the Protocol doesn't return any).
  // The test is cheating by specifying a fake "bundle_input" source
  // but the new Console won't render this, since it can't match it up with an actual source.
  // Test.assert(
  //   msg.querySelector(".frame-link a").innerText == location,
  //   `Message location should be ${location}`
  // );
}

Test.describe(`Test breakpoints in a sourcemapped file.`, async () => {
  console.log("Test that the breakpoint added to line 15 maps to line 15");
  await Test.addBreakpoint("bundle_input.js", 15, undefined, {
    logValue: "'line 15'",
  });
  await checkMessageLocation("line 15", "bundle_input.js:15");

  console.log("Test that the breakpoint added to line 17 maps to line 17");
  await Test.addBreakpoint("bundle_input.js", 17, undefined, {
    logValue: "'line 17'",
  });
  await checkMessageLocation("line 17", "bundle_input.js:17");
});
