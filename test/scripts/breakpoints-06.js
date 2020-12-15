async function checkMessageLocation(text, location) {
  const msg = await Test.waitForMessage(text);
  Test.assert(
    msg.querySelector(".frame-link a").innerText == location,
    `Message location should be ${location}`
  );
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
