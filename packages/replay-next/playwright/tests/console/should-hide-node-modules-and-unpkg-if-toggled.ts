import { test } from "@playwright/test";

import { toggleProtocolMessage } from "../utils/console";
import { takeScreenshot } from "../utils/general";
import { beforeEach } from "./beforeEach";
import { setup } from "./shared";

beforeEach();

test("should hide node_modules (and unpkg) if toggled", async ({ page }) => {
  await setup(page, false);
  await toggleProtocolMessage(page, "warnings", true);
  await toggleProtocolMessage(page, "nodeModules", true);

  const list = page.locator("[data-test-name=Messages]");
  await takeScreenshot(page, list, "filtered-all-warnings");

  await toggleProtocolMessage(page, "nodeModules", false);
  await takeScreenshot(page, list, "filtered-all-warnings-no-node-modules");
});
