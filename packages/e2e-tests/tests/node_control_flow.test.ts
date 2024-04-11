import { startTest } from "../helpers";
import { resumeToLine, rewindToLine } from "../helpers/pause-information-panel";
import { openSource, openSourceExplorerPanel } from "../helpers/source-explorer-panel";
import { addBreakpoint } from "../helpers/source-panel";
import test, { Page } from "../testFixture";

async function resumeToBreakpoint(page: Page, line: number) {
  await addBreakpoint(page, { url: "control_flow.js", lineNumber: line });
  await resumeToLine(page, line);
}

test.use({ exampleKey: "node/control_flow.js" });

test("node_control_flow: catch, finally, generators, and async/await", async ({
  pageWithMeta: { page, recordingId, testScope },
  exampleKey,
}) => {
  // Default timeout is 30s. Mostly taking 40s in local dev. Bump to 120s.
  test.setTimeout(120000);
  await startTest(page, recordingId, testScope);

  await openSource(page, "control_flow.js");

  await rewindToLine(page, 84);

  await resumeToBreakpoint(page, 10);
  await resumeToBreakpoint(page, 12);
  await resumeToBreakpoint(page, 18);
  await resumeToBreakpoint(page, 20);
  await resumeToBreakpoint(page, 32);
  await resumeToBreakpoint(page, 27);

  await resumeToLine(page, 32);
  await resumeToLine(page, 27);

  await resumeToBreakpoint(page, 42);
  await resumeToBreakpoint(page, 44);
  await resumeToBreakpoint(page, 50);
  await resumeToBreakpoint(page, 54);
  await resumeToBreakpoint(page, 65);
  await resumeToBreakpoint(page, 72);
});
