(async () => {
  const url = new URL(location.href);
  if (!url.searchParams.get("navigated")) {
    // part one of the test, before the example recording is reloaded:
    console.log(`# Test that breakpoints work across navigations.`);
    await Test.start();

    await Test.waitForSource("bundle_input.js");

    Test.app.actions.openQuickOpen();
    Test.app.actions.setQuickOpenQuery("bundle");
    await Test.waitUntil(
      () => {
        const foundSourceUrls = [...document.querySelectorAll("#result-list .title")].map(
          el => el.textContent
        );
        return JSON.stringify(foundSourceUrls) === '["bundle_input.js"]';
      },
      { waitingFor: "bundle_input.js to be present in source urls" }
    );
    Test.app.actions.closeQuickOpen();

    await Test.addBreakpoint("bundle_input.js", 5);
    await Test.addLogpoint("bundle_input.js", 5);

    await Test.rewindToLine(5);
    await checkBreakpointPanel(2);

    await Test.rewindToLine(5);
    await checkBreakpointPanel(1);

    await closeEditor();
    // click the first source link in the console
    document.querySelectorAll(".webconsole-output .frame-link-source")[0].click();
    await checkBreakpointPanel(1);
    await checkDebugLine();

    await closeEditor();
    // click the second source link in the console
    document.querySelectorAll(".webconsole-output .frame-link-source")[1].click();
    await checkBreakpointPanel(1);
    await checkDebugLine();

    // reload the recording
    url.searchParams.append("navigated", "true");
    document.location.href = url.href;
    await new Promise(() => {});
  } else {
    // part two of the test, after reloading:
    Test.app.actions.setViewMode("dev");

    await Test.waitUntil(
      () => document.querySelectorAll(".breakpoints-list .breakpoint").length === 2,
      { waitingFor: "a breakpoint and a logpoint to be present" }
    );

    Test.finish();
  }
})();

async function checkBreakpointPanel(selectedBreakpoint) {
  await Test.waitUntil(
    () => {
      const statusElement = document.querySelector(".breakpoint-navigation-status-container");
      return statusElement && statusElement.textContent === `${selectedBreakpoint}/2`;
    },
    { waitingFor: `${selectedBreakpoint}/2 to be selected` }
  );
}

async function checkDebugLine() {
  await Test.waitUntil(
    () => document.querySelector(".editor-pane .CodeMirror-code .new-debug-line"),
    { waitingFor: "new debug line to be present" }
  );
}

async function closeEditor() {
  document.querySelector(".source-tabs .close").click();
  await Test.waitUntil(
    () => document.querySelector(".breakpoint-navigation-status-container") === null,
    { waitingFor: "source tab to close" }
  );
}
