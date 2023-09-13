import { openDevToolsTab, startTest } from "../helpers";
import {
  filterByText,
  openNetworkPanel,
  toggleFilterByType,
  toggleFilterByTypePanel,
  verifyNetworkRequestsCount,
} from "../helpers/network-panel";
import test from "../testFixtureCloneRecording";

test.use({ exampleKey: "flake/adding-spec.ts" });

test(`network-01: should filter requests by type and text`, async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openDevToolsTab(page);
  await openNetworkPanel(page);

  await verifyNetworkRequestsCount(page, 247);

  await toggleFilterByTypePanel(page, true);
  await toggleFilterByType(page, "Image", true);
  await verifyNetworkRequestsCount(page, 11);

  await filterByText(page, "/assets/");
  await verifyNetworkRequestsCount(page, 3);

  await toggleFilterByType(page, "HTML", true);
  await verifyNetworkRequestsCount(page, 3);

  await filterByText(page, "");
  await verifyNetworkRequestsCount(page, 21);

  await toggleFilterByType(page, "Image", false);
  await verifyNetworkRequestsCount(page, 10);

  await toggleFilterByType(page, "HTML", false);
  await verifyNetworkRequestsCount(page, 247);

  await filterByText(page, "css");
  await verifyNetworkRequestsCount(page, 40);
});
