import test, { Page } from "@playwright/test";

import { startTest } from "../helpers";
import { resumeToLine, rewindToLine } from "../helpers/pause-information-panel";
import { openSource, openSourceExplorerPanel } from "../helpers/source-explorer-panel";
import { addBreakpoint } from "../helpers/source-panel";

async function resumeToBreakpoint(page: Page, line: number) {
  await addBreakpoint(page, { url: "control_flow.js", lineNumber: line });
  await resumeToLine(page, { lineNumber: line });
}

test("node_control_flow: catch, finally, generators, and async/await", async ({ page }) => {
  // Default timeout is 30s. Mostly taking 40s in local dev. Bump to 120s.
  test.setTimeout(120000);
  await startTest(page, "node/control_flow.js");
  await openSourceExplorerPanel(page);

  await openSource(page, "control_flow.js");

  await rewindToLine(page, { lineNumber: 84 });

  await resumeToBreakpoint(page, 10);
  await resumeToBreakpoint(page, 12);
  await resumeToBreakpoint(page, 18);
  await resumeToBreakpoint(page, 20);
  await resumeToBreakpoint(page, 32);
  await resumeToBreakpoint(page, 27);

  await resumeToLine(page, { lineNumber: 32 });
  await resumeToLine(page, { lineNumber: 27 });

  await resumeToBreakpoint(page, 42);
  await resumeToBreakpoint(page, 44);
  await resumeToBreakpoint(page, 50);
  await resumeToBreakpoint(page, 54);
  await resumeToBreakpoint(page, 65);
  await resumeToBreakpoint(page, 72);
});
