import {
  test,
  openExample,
  clickDevTools,
  rewindToLine,
  stepOverToLine,
  stepOutToLine,
  stepInToLine,
  addEventListenerLogpoints,
  addBreakpoint,
  resumeToLine,
  selectConsole,
  warpToMessage,
  delay,
} from "../helpers";

test(`Test stepping in pretty-printed code`, async ({ screen }) => {
  screen.setDefaultTimeout(120000);
  await openExample(screen, "doc_minified.html");
  await clickDevTools(screen);

  await addBreakpoint(screen, { url: "bundle_input.js", lineNumber: 4 });
  await rewindToLine(screen, { lineNumber: 4 });
  await stepInToLine(screen, 1);

  // Add a breakpoint in minified.html and resume to there
  await addBreakpoint(screen, { url: "doc_minified.html", lineNumber: 8 });
  await resumeToLine(screen, { lineNumber: 8 });
  await stepOverToLine(screen, 8);
  await stepOverToLine(screen, 9);

  await selectConsole(screen);
  await addEventListenerLogpoints(screen, ["event.mouse.click"]);
  await warpToMessage(screen, "click", 14);

  await stepInToLine(screen, 2);
  await stepOutToLine(screen, 15);
  await stepInToLine(screen, 10);
  await stepOutToLine(screen, 15);
  await stepInToLine(screen, 5);
  await stepOutToLine(screen, 15);
});
