import { expect, test } from "@playwright/test";

import {
  continueTo,
  isContinueToNextOptionEnabled,
  isContinueToPreviousOptionEnabled,
  verifyCurrentExecutionPoint,
} from "replay-next/playwright/tests/utils/source";

import { beforeEach } from "./beforeEach";
import { fileName, sourceId } from "./shared";

beforeEach();

test("should support continue to next and previous functionality", async ({ page }, testInfo) => {
  // Continue to next should be enabled initially;
  // Continue to previous should not be.
  await expect(await isContinueToNextOptionEnabled(page, sourceId, 14)).toBe(true);
  await expect(await isContinueToPreviousOptionEnabled(page, sourceId, 14)).toBe(false);

  // Go to line 14.
  await verifyCurrentExecutionPoint(page, { expected: false, fileName, lineNumber: 14, sourceId });
  await continueTo(page, { lineNumber: 14, direction: "next", sourceId, use: "hover-button" });
  await verifyCurrentExecutionPoint(page, { fileName, lineNumber: 14, sourceId });

  // Continue to next and previous buttons should both now be disabled for line 14.
  // Continue to previous should be enabled for line 13
  // And continue to next should be enabled for line 15.
  await expect(await isContinueToNextOptionEnabled(page, sourceId, 13)).toBe(false);
  await expect(await isContinueToPreviousOptionEnabled(page, sourceId, 13)).toBe(true);
  await expect(await isContinueToNextOptionEnabled(page, sourceId, 14)).toBe(false);
  await expect(await isContinueToPreviousOptionEnabled(page, sourceId, 14)).toBe(false);
  await expect(await isContinueToNextOptionEnabled(page, sourceId, 15)).toBe(true);
  await expect(await isContinueToPreviousOptionEnabled(page, sourceId, 15)).toBe(false);

  // Verify the same things but using the context menu.

  await continueTo(page, { lineNumber: 13, direction: "previous", sourceId, use: "context-menu" });
  await verifyCurrentExecutionPoint(page, { fileName, lineNumber: 13, sourceId });

  await continueTo(page, { lineNumber: 14, direction: "next", sourceId, use: "context-menu" });
  await verifyCurrentExecutionPoint(page, { fileName, lineNumber: 14, sourceId });

  await continueTo(page, { lineNumber: 15, direction: "next", sourceId, use: "context-menu" });
  await verifyCurrentExecutionPoint(page, { fileName, lineNumber: 15, sourceId });

  await continueTo(page, { lineNumber: 14, direction: "previous", sourceId, use: "context-menu" });
  await verifyCurrentExecutionPoint(page, { fileName, lineNumber: 14, sourceId });
});
