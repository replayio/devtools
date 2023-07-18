import { openDevToolsTab, startTest } from "../helpers";
import {
  getConsoleDockButton,
  getConsoleDockToBottomButton,
  getConsoleDockToBottomRightButton,
  getConsoleDockToLeftButton,
  verifyConsoleLayout,
} from "../helpers/dock";
import test, { expect } from "../testFixtureCloneRecording";

test.use({ exampleKey: "doc_rr_basic.html" });

test("console_dock: Should show the correct docking behavior for recordings with video", async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, exampleKey, recordingId);
  await openDevToolsTab(page);

  // Verify default docking position
  await verifyConsoleLayout(page, "ide");

  // Verify docking options
  await getConsoleDockButton(page).click();
  await expect(getConsoleDockToBottomButton(page)).toBeVisible();
  await expect(getConsoleDockToBottomRightButton(page)).toBeVisible();
  await expect(getConsoleDockToLeftButton(page)).toBeVisible();

  // Toggle bottom and verify
  await getConsoleDockToBottomButton(page).click();
  await verifyConsoleLayout(page, "bottom");

  // Toggle left and verify
  await getConsoleDockButton(page).click();
  await getConsoleDockToLeftButton(page).click();
  await verifyConsoleLayout(page, "left");

  // Toggle back to bottom right and verify
  await getConsoleDockButton(page).click();
  await getConsoleDockToBottomRightButton(page).click();
  await verifyConsoleLayout(page, "ide");
});
