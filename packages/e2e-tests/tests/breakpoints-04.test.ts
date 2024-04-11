import { openDevToolsTab, startTest } from "../helpers";
import { resumeToLine, rewindToLine } from "../helpers/pause-information-panel";
import { addBreakpoint } from "../helpers/source-panel";
import test, { Page } from "../testFixture";

test.use({ exampleKey: "doc_control_flow.html" });

// Test hitting breakpoints when using tricky control flow constructs:
test(`breakpoints-04: catch, finally, generators, and async/await`, async ({
  pageWithMeta: { page, recordingId, testScope },
  exampleKey,
}) => {
  await startTest(page, recordingId, testScope);
  await openDevToolsTab(page);

  await rewindToBreakpoint(page, 10);
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

  async function rewindToBreakpoint(page: Page, lineNumber: number) {
    await addBreakpoint(page, { lineNumber, url: exampleKey });
    await rewindToLine(page, lineNumber);
  }

  async function resumeToBreakpoint(page: Page, lineNumber: number) {
    await addBreakpoint(page, { lineNumber, url: exampleKey });
    await resumeToLine(page, lineNumber);
  }
});
