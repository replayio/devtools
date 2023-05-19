import { expect, test } from "@playwright/test";

import { waitFor } from "../utils/general";
import {
  clearSearchResult,
  getSourceSearchResultsLabelLocator,
  goToNextSourceSearchResult,
  goToPreviousSourceSearchResult,
  openSourceFile,
  searchSourceText,
} from "../utils/source";
import { beforeEach } from "./beforeEach";
import { altSourceId, sourceId } from "./shared";

beforeEach();

test("should remember search results count per source", async ({ page }, testInfo) => {
  await openSourceFile(page, sourceId);
  const resultsLabel = getSourceSearchResultsLabelLocator(page);
  await searchSourceText(page, "function");
  await expect(await resultsLabel.textContent()).toBe("1 of 5 results");
  await goToNextSourceSearchResult(page);
  await goToNextSourceSearchResult(page);
  await expect(await resultsLabel.textContent()).toBe("3 of 5 results");

  await openSourceFile(page, altSourceId);
  await waitFor(async () => expect(await resultsLabel.textContent()).toBe("? of 20 results"));
  await goToNextSourceSearchResult(page);
  await goToNextSourceSearchResult(page);
  await goToNextSourceSearchResult(page);
  await expect(await resultsLabel.textContent()).toBe("3 of 20 results");

  await openSourceFile(page, sourceId);
  await waitFor(async () => expect(await resultsLabel.textContent()).toBe("? of 5 results"));
  await goToPreviousSourceSearchResult(page);
  await expect(await resultsLabel.textContent()).toBe("5 of 5 results");

  await openSourceFile(page, altSourceId);
  await waitFor(async () => expect(await resultsLabel.textContent()).toBe("? of 20 results"));

  await clearSearchResult(page);
  await expect(await resultsLabel.isVisible()).toBe(false);
  await openSourceFile(page, sourceId);
  await expect(await resultsLabel.isVisible()).toBe(false);
});
