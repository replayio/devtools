import { openDevToolsTab, startTest } from "../helpers";
import {
  filterByText,
  openNetworkPanel,
  selectRequestDetailsTab,
  selectRequestRow,
  verifyNetworkDetailsPanelContains,
  verifyNetworkDetailsTabsVisible,
} from "../helpers/network-panel";
import test from "../testFixture";

test.use({ exampleKey: "flake/adding-spec.ts" });

test(`network-02: should show details for the selected request`, async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openDevToolsTab(page);
  await openNetworkPanel(page);

  // Select an SVG element and verify the correct detail headers are shown
  await filterByText(page, "http://localhost:8888/__/assets/generic-browser.b2bc06f2.svg");
  await selectRequestRow(page, {
    name: "image/svg+xml",
  });
  await verifyNetworkDetailsTabsVisible(page, ["Headers", "Response", "Timings"]);

  // Select a JavaScript file request
  await filterByText(page, "SpecPatterns");
  await selectRequestRow(page, {
    name: "SpecPatterns",
  });
  await verifyNetworkDetailsTabsVisible(page, ["Headers", "Response", "Stack Trace", "Timings"]);

  // Verify Header tails
  await verifyNetworkDetailsPanelContains(
    page,
    "http://localhost:8888/__/assets/SpecPatterns.9c16fff4.js"
  );

  // Verify Response details
  await selectRequestDetailsTab(page, "Response");
  await verifyNetworkDetailsPanelContains(page, "import { d as defineComponent");

  // Verify Stack Trace details
  await selectRequestDetailsTab(page, "Stack Trace");
  await verifyNetworkDetailsPanelContains(page, "extractComponentsGuards");

  await filterByText(page, "");

  // Verify that up/down arrow keys change the selected request
  await selectRequestRow(page, { name: "polyfills.dabe60b8.js" });
  await verifyNetworkDetailsPanelContains(page, "polyfills.dabe60b8.js");

  await page.keyboard.press("ArrowDown");
  await verifyNetworkDetailsPanelContains(page, "index.fcb7159a.js");

  await page.keyboard.press("ArrowUp");
  await verifyNetworkDetailsPanelContains(page, "polyfills.dabe60b8.js");
});
