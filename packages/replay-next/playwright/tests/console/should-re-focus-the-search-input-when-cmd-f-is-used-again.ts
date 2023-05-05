import { expect, test } from "@playwright/test";

import { getConsoleSearchInput, showSearchInput } from "../utils/console";
import { beforeEach } from "./beforeEach";
import { setup } from "./shared";

beforeEach();

test("should re-focus the search input when CMD+F is used again", async ({ page }) => {
  await setup(page);

  await showSearchInput(page);

  const searchInput = getConsoleSearchInput(page);
  await expect(searchInput).toHaveCount(1);
  await expect(searchInput).toBeFocused();
});
