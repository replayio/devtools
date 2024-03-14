import { openDevToolsTab, startTest } from "../helpers";
import {
  filterByText,
  openNetworkPanel,
  toggleFilterByType,
  toggleFilterByTypePanel,
  verifyNetworkRequestsCount,
} from "../helpers/network-panel";
import test from "../testFixture";

test.use({ exampleKey: "flake/adding-spec.ts" });

test(`network-01: should filter requests by type and text`, async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openDevToolsTab(page);
  await openNetworkPanel(page);

  await verifyNetworkRequestsCount(page, 134);

  await toggleFilterByTypePanel(page, true);
  await toggleFilterByType(page, "Image", true);
  await verifyNetworkRequestsCount(page, 9);

  await filterByText(page, "/assets/");
  await verifyNetworkRequestsCount(page, 1);

  await toggleFilterByType(page, "HTML", true);
  await verifyNetworkRequestsCount(page, 1);

  await filterByText(page, "");
  await verifyNetworkRequestsCount(page, 9);

  await toggleFilterByType(page, "Image", false);
  await verifyNetworkRequestsCount(page, 0);

  await toggleFilterByType(page, "HTML", false);
  await verifyNetworkRequestsCount(page, 134);

  await filterByText(page, "css");
  await verifyNetworkRequestsCount(page, 22);
});
