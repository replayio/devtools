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

/*
Test.describe(`Test stepping in pretty-printed code.`, async () => {
    
  await Test.addBreakpoint("bundle_input.js", 4);
    await Test.rewindToLine(4);
    await Test.stepInToLine(1);
  
    await Test.addBreakpoint("doc_minified.html", 8);
    await Test.resumeToLine(8);
  
    await Test.stepOverToLine(8);
    await Test.stepOverToLine(9);
  
    await Test.selectConsole();
    await Test.addEventListenerLogpoints(["event.mouse.click"]);
  
    await Test.warpToMessage("click");
  
    await Test.stepInToLine(2);
    await Test.stepOutToLine(15);
    await Test.stepInToLine(10);
    await Test.stepOutToLine(15);
    await Test.stepInToLine(5);
    await Test.stepOutToLine(15);
  });
  
  */
