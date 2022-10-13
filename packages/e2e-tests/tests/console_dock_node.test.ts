import test, { expect } from "@playwright/test";

import { startTest } from "../helpers";
import {
  getConsoleDockButton,
  getConsoleDockFullViewButton,
  getConsoleDockSplitViewButton,
  verifyConsoleLayout,
} from "../helpers/dock";

const url = "node/basic.js";

test("console_dock_node: Should show the correct docking behavior for recordings without video", async ({
  page,
}) => {
  await startTest(page, url);

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
