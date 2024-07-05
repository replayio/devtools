import { startTest } from "../helpers";
import { openSource } from "../helpers/source-explorer-panel";
import { addBreakpoint, fastForwardToLine, rewindToLine } from "../helpers/source-panel";
import test, { Page } from "../testFixture";

async function resumeToBreakpoint(page: Page, line: number) {
  await addBreakpoint(page, { url: "control_flow.js", lineNumber: line });
  await fastForwardToLine(page, { lineNumber: line });
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

  await rewindToLine(page, { lineNumber: 84 });

  await resumeToBreakpoint(page, 10);
  await resumeToBreakpoint(page, 12);
  await resumeToBreakpoint(page, 18);
  await resumeToBreakpoint(page, 20);
  await resumeToBreakpoint(page, 32);
  await resumeToBreakpoint(page, 27);

  await fastForwardToLine(page, { lineNumber: 32 });
  await fastForwardToLine(page, { lineNumber: 27 });

  await resumeToBreakpoint(page, 42);
  await resumeToBreakpoint(page, 44);
  await resumeToBreakpoint(page, 50);
  await resumeToBreakpoint(page, 54);
  await resumeToBreakpoint(page, 65);
  await resumeToBreakpoint(page, 72);
});
