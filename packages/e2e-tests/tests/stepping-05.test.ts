import { test } from "@playwright/test";
import {
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
} from "../helpers";

test(`Test stepping in pretty-printed code`, async ({ page }) => {
  await openExample(page, "doc_minified.html");
  await clickDevTools(page);
  await addBreakpoint(page, "bundle_input.js", 4);
  await rewindToLine(page, 4);
  await stepInToLine(page, 1);

  // Add a breakpoint in minified.html and resume to there
  await addBreakpoint(page, "doc_minified.html", 8);
  await resumeToLine(page, 8);
  await stepOverToLine(page, 8);
  await stepOverToLine(page, 9);

  await selectConsole(page);
  await addEventListenerLogpoints(page, ["event.mouse.click"]);
  await warpToMessage(page, "click", 14);

  await stepInToLine(page, 2);
  await stepOutToLine(page, 15);
  await stepInToLine(page, 10);
  await stepOutToLine(page, 15);
  await stepInToLine(page, 5);
  await stepOutToLine(page, 15);
});
