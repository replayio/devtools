import {
  addBreakpoint,
  addLogpoint,
  clickDevTools,
  closeSource,
  delay,
  openExample,
  quickOpen,
  rewindToLine,
  test,
  verifyBreakpointStatus,
} from "../helpers";

test(`Test TODO name this thing.`, async ({ screen }) => {
  await openExample(screen, "doc_navigate.html");
  await clickDevTools(screen);

  await quickOpen(screen, "bundle_input.js");

  await addBreakpoint(screen, { lineNumber: 5, url: "bundle_input.js" });
  await addLogpoint(screen, { lineNumber: 5, url: "bundle_input.js" });

  await rewindToLine(screen, { lineNumber: 5 });
  await verifyBreakpointStatus(screen, "2/2", { lineNumber: 5 });

  await rewindToLine(screen, { lineNumber: 5 });
  await verifyBreakpointStatus(screen, "1/2", { lineNumber: 5 });

  await closeSource(screen, "bundle_input.js");

  await delay(2500); // TODO Finish the test
});

/*
(async () => {
    const url = new URL(location.href);
    if (!url.searchParams.get("navigated")) {
      // click the first source link in the console
      document.querySelectorAll(".webconsole-output .frame-link-source")[0].click();
      await checkBreakpointPanel(1);
      await checkDebugLine();
  
      await closeEditor();
      // click the second source link in the console
      document.querySelectorAll(".webconsole-output .frame-link-source")[1].click();
      await checkBreakpointPanel(1);
      await checkDebugLine();
  
      // wait to ensure that the currently selected panel is saved to asyncStorage
      // so that it is selected again after reloading
      await Test.waitForTime(1000);
  
      // reload the recording
      url.searchParams.append("navigated", "true");
      document.location.href = url.href;
      await new Promise(() => {});
    } else {
      // part two of the test, after reloading:
      // Test.app.actions.setViewMode("dev");

      // await Test.waitUntil(
      //   () => document.querySelectorAll(".breakpoints-list .breakpoint").length === 2,
      //   { waitingFor: "a breakpoint and a logpoint to be present" }
      // );
  
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
 */
