import { openDevToolsTab, startTest } from "../helpers";
import {
  toggleToolboxLayout,
  verifyToolboxLayout,
  verifyToolboxLayoutOptions,
} from "../helpers/layout";
import test from "../testFixtureCloneRecording";

test.use({ exampleKey: "doc_rr_basic_chromium.html" });

test("console_dock: Should show the correct docking behavior for recordings with video", async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openDevToolsTab(page);

  // Verify default docking position
  await verifyToolboxLayout(page, "ide");

  // Verify docking options
  await verifyToolboxLayoutOptions(page, ["ide", "left", "bottom"]);

  // Toggle bottom and verify
  await toggleToolboxLayout(page, "bottom");
  await verifyToolboxLayout(page, "bottom");

  // Toggle left and verify
  await toggleToolboxLayout(page, "left");
  await verifyToolboxLayout(page, "left");

  // Toggle back to bottom right and verify
  await toggleToolboxLayout(page, "ide");
  await verifyToolboxLayout(page, "ide");
});
