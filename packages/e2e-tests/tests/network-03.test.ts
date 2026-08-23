import { openDevToolsTab, startTest } from "../helpers";
import {
  openNetworkPanel,
  seekToRequestRow,
  selectRequestRow,
  verifyRequestRowTimelineState,
} from "../helpers/network-panel";
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

  // This test used to also verify that moving the current time from outside the Network
  // panel (via the source panel's fast-forward-to-line button) flips the row markers back.
  // That check is disabled: on this example's pinned recording (a667c000, recorded 2024-02
  // with linux-chromium-20240208), line hit counts load but hit points never resolve, so the
  // fast-forward button stays disabled for every source — even a 100-line unminified one.
  // Restore the check if the "flake/adding-spec.ts" example is ever re-recorded.
});
