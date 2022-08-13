import { test } from "@playwright/test";
import {
  openExample,
  clickDevTools,
  rewindToLine,
  reverseStepOverToLine,
  stepOverToLine,
  clickSourceTreeNode,
  toggleBreakpoint,
  checkEvaluateInTopFrame,
} from "../helpers";

test(`Stepping past the beginning or end of a frame should act like a step-out.`, async ({
  page,
}) => {
  await openExample(page, "doc_rr_basic.html");
  await clickDevTools(page);

  // Open doc_rr_basic.html
  await clickSourceTreeNode(page, "test");
  await clickSourceTreeNode(page, "examples");
  await clickSourceTreeNode(page, "doc_rr_basic.html");

  await toggleBreakpoint(page, 20);

  await rewindToLine(page, 20);
  await checkEvaluateInTopFrame(page, "number", "10");
  await reverseStepOverToLine(page, 19);
  await reverseStepOverToLine(page, 11);

  // After reverse-stepping out of the topmost frame we should rewind to the
  // last breakpoint hit.
  await reverseStepOverToLine(page, 20);
  await checkEvaluateInTopFrame(page, "number", "9");

  await stepOverToLine(page, 21);
  await stepOverToLine(page, 22);
  await stepOverToLine(page, 12);
  await stepOverToLine(page, 16);
  await stepOverToLine(page, 17);

  // After forward-stepping out of the topmost frame we should run forward to
  // the next breakpoint hit.
  await stepOverToLine(page, 20);
  await checkEvaluateInTopFrame(page, "number", "10");
});
