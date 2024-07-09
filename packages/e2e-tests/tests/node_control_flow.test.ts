import { startTest } from "../helpers";
import { openSource } from "../helpers/source-explorer-panel";
import { fastForwardToLine, rewindToLine } from "../helpers/source-panel";
import test from "../testFixture";

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

  await fastForwardToLine(page, { lineNumber: 10 });
  await fastForwardToLine(page, { lineNumber: 12 });
  await fastForwardToLine(page, { lineNumber: 18 });
  await fastForwardToLine(page, { lineNumber: 20 });
  await fastForwardToLine(page, { lineNumber: 32 });
  await fastForwardToLine(page, { lineNumber: 27 });
  await fastForwardToLine(page, { lineNumber: 32 });
  await fastForwardToLine(page, { lineNumber: 27 });
  await fastForwardToLine(page, { lineNumber: 42 });
  await fastForwardToLine(page, { lineNumber: 44 });
  await fastForwardToLine(page, { lineNumber: 50 });
  await fastForwardToLine(page, { lineNumber: 54 });
  await fastForwardToLine(page, { lineNumber: 65 });
  await fastForwardToLine(page, { lineNumber: 72 });
});
