import { expect, test } from "@playwright/test";

import {
  getConsoleInput,
  getConsoleSearchInput,
  hideSearchInput,
  showSearchInput,
} from "../utils/console";
import { beforeEach } from "./beforeEach";
import { setup } from "./shared";

beforeEach();

test("should re-focus the terminal input when search input is hidden", async ({ page }) => {
  await setup(page);

  const consoleInput = getConsoleInput(page);
  const searchInput = getConsoleSearchInput(page);

  await showSearchInput(page);
  await expect(searchInput).toBeFocused();

  await hideSearchInput(page);
  await expect(consoleInput).toBeFocused();
});
