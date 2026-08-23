import { openDevToolsTab, startTest } from "../helpers";
import { quickOpen } from "../helpers/commands";
import {
  openNetworkPanel,
  seekToRequestRow,
  selectRequestRow,
  verifyRequestRowTimelineState,
} from "../helpers/network-panel";
import { fastForwardToLine } from "../helpers/source-panel";
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

  // Moving the current time from outside the Network panel should update the indicator
  // too. "todoModel.js" is a small unminified app source, so its line numbers don't move
  // when the backend changes how it formats sources, and line 30 runs a dozen times
  // across the recording — all of them after the request we just seeked to.
  await quickOpen(page, "todoModel.js");
  await fastForwardToLine(page, { lineNumber: 30 });
  await verifyRequestRowTimelineState(
    page,
    {
      name: "cypress_runner.js",
    },
    "before"
  );
});
