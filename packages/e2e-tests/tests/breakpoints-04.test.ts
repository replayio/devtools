import {
  addBreakpoint,
  clickDevTools,
  openExample,
  rewindToLine,
  resumeToLine,
  Screen,
  test,
} from "../helpers";

// Test hitting breakpoints when using tricky control flow constructs:
test(`catch, finally, generators, and async/await.`, async ({ screen }) => {
  await openExample(screen, "doc_control_flow.html");
  await clickDevTools(screen);

  await rewindToBreakpoint(screen, 10);
  await resumeToBreakpoint(screen, 12);
  await resumeToBreakpoint(screen, 18);
  await resumeToBreakpoint(screen, 20);
  await resumeToBreakpoint(screen, 32);
  await resumeToBreakpoint(screen, 27);
  await resumeToLine(screen, { lineNumber: 32 });
  await resumeToLine(screen, { lineNumber: 27 });
  await resumeToBreakpoint(screen, 42);
  await resumeToBreakpoint(screen, 44);
  await resumeToBreakpoint(screen, 50);
  await resumeToBreakpoint(screen, 54);
  await resumeToBreakpoint(screen, 65);
  await resumeToBreakpoint(screen, 72);

  async function rewindToBreakpoint(screen: Screen, lineNumber: number) {
    await addBreakpoint(screen, { lineNumber, url: "doc_control_flow.html" });
    await rewindToLine(screen, { lineNumber });
  }

  async function resumeToBreakpoint(screen: Screen, lineNumber: number) {
    await addBreakpoint(screen, { lineNumber, url: "doc_control_flow.html" });
    await resumeToLine(screen, { lineNumber });
  }
});
