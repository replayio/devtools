import { expect, test } from "@playwright/test";

import { waitFor } from "../utils/general";
import {
  getSourceLineLocator,
  goToLine,
  openSourceFile,
  waitForSourceContentsToStream,
} from "../utils/source";
import { beforeEach } from "./beforeEach";
import { altSourceId, sourceId } from "./shared";

beforeEach();

test("scroll position should be restored when switching between sources", async ({ page }) => {
  // Scroll to the bottom of source 1
  await openSourceFile(page, sourceId);
  await goToLine(page, sourceId, 77);
  const line77 = getSourceLineLocator(page, sourceId, 77);
  await waitFor(async () => expect(await line77.isVisible()).toBe(true));

  // Open source 2 and scroll to the middle
  await openSourceFile(page, altSourceId);
  await waitForSourceContentsToStream(page, altSourceId);
  await goToLine(page, altSourceId, 100);
  const line100 = getSourceLineLocator(page, altSourceId, 100);
  await waitFor(async () => expect(await line100.isVisible()).toBe(true));

  // Switch back and verify that we're still at the bottom of source 1
  await openSourceFile(page, sourceId);
  await waitFor(async () => expect(await line77.isVisible()).toBe(true));

  // Switch back and verify that we're still in the middle of source 2
  await openSourceFile(page, altSourceId);
  await waitFor(async () => expect(await line100.isVisible()).toBe(true));
});
