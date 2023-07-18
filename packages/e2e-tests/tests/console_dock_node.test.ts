import { startTest } from "../helpers";
import {
  getConsoleDockButton,
  getConsoleDockFullViewButton,
  getConsoleDockSplitViewButton,
  verifyConsoleLayout,
} from "../helpers/dock";
import test, { expect } from "../testFixtureCloneRecording";

test.use({ exampleKey: "node/basic.js" });

test("console_dock_node: Should show the correct docking behavior for recordings without video", async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, exampleKey, recordingId);

  // Verify default docking position
  await verifyConsoleLayout(page, "ide");

  // Verify docking options
  await getConsoleDockButton(page).click();
  await expect(getConsoleDockFullViewButton(page)).toBeVisible();
  await expect(getConsoleDockSplitViewButton(page)).toBeVisible();

  // Toggle full view and verify
  await getConsoleDockFullViewButton(page).click();
  await verifyConsoleLayout(page, "full");

  // Toggle back to split view and verify
  await getConsoleDockButton(page).click();
  await getConsoleDockSplitViewButton(page).click();
  await verifyConsoleLayout(page, "ide");
});
