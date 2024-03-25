import { openDevToolsTab, startTest } from "../helpers";
import {
  toggleToolboxLayout,
  verifyToolboxLayout,
  verifyToolboxLayoutOptions,
} from "../helpers/layout";
import test from "../testFixture";

test.use({ exampleKey: "node/basic.js" });

test("node_console_dock: Should show the correct docking behavior for recordings without video", async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openDevToolsTab(page);

  // Verify default docking position
  await verifyToolboxLayout(page, "left");

  // Verify docking options
  await verifyToolboxLayoutOptions(page, ["left", "full"]);

  // Toggle full view and verify
  await toggleToolboxLayout(page, "full");
  await verifyToolboxLayout(page, "full");

  // Toggle back to split view and verify
  await toggleToolboxLayout(page, "left");
  await verifyToolboxLayout(page, "left");
});
