import { openDevToolsTab, startTest } from "../helpers";
import {
  openNetworkPanel,
  seekToRequestRow,
  selectRequestRow,
  verifyRequestRowTimelineState,
} from "../helpers/network-panel";
import { fastForwardToLine, waitForSourceContentsToFinishStreaming } from "../helpers/source-panel";
import test from "../testFixture";

test.use({ exampleKey: "flake/adding-spec.ts" });

test(`network-03: should sync and display the current time in relation to the network requests`, async ({
  pageWithMeta: { page, recordingId, testScope },
  exampleKey,
}) => {
  await startTest(page, recordingId, testScope);
  await openDevToolsTab(page);
  await openNetworkPanel(page);

  await selectRequestRow(page, {
    name: "cypress_runner.js",
  });

  await verifyRequestRowTimelineState(
    page,
    {
      name: "cypress_runner.js",
    },
    "before"
  );

  // Seek button should update th timeline
  await seekToRequestRow(page, {
    name: "cypress_runner.js",
  });
  await verifyRequestRowTimelineState(
    page,
    {
      name: "index.42ea0b38.css",
    },
    "before"
  );
  await verifyRequestRowTimelineState(
    page,
    {
      name: "cypress_runner.js",
    },
    "first-after"
  );
  await verifyRequestRowTimelineState(
    page,
    {
      name: "cypress_runner.css",
    },
    "after"
  );

  // Changes to the current should update the indicator in the Network panel also
  // Seeking to the "cypress_runner.js" request will have opened "cypress_runner.css"
  // cypress_runner.js is a very large bundle. Direct measurement puts the streaming
  // time under a second, but it has repeatedly exceeded the 15s default in CI, so give
  // it a wider budget. If it still times out here, the stream is stuck rather than slow.
  await waitForSourceContentsToFinishStreaming(page, { sourceId: "pp6", timeout: 45_000 });
  await fastForwardToLine(page, { lineNumber: 118 });
  await verifyRequestRowTimelineState(
    page,
    {
      name: "cypress_runner.js",
    },
    "before"
  );
});
