import { Locator } from "@playwright/test";

import { isViewerTabActive, openViewerTab, startTest } from "../helpers";
import { closeSource, getSelectedLineNumber, waitForSelectedSource } from "../helpers/source-panel";
import {
  getSelectedTestCase,
  getTestCaseSteps,
  getTestRows,
  getTestStepBeforeAfterButtons,
  getTestSuitePanel,
  getUserActionEventDetails,
  openPlaywrightTestPanel,
} from "../helpers/testsuites";
import { getTimelineCurrentPercent, waitForTimelineAdvanced } from "../helpers/timeline";
import { getByTestName, waitFor } from "../helpers/utils";
import test, { expect } from "../testFixture";

test.use({ exampleKey: "playwright/breakpoints-05" });

test("playwright-04: Test Step buttons and menu item", async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openViewerTab(page);

  await openPlaywrightTestPanel(page);

  // has 1 test
  const rows = getTestRows(page);
  await waitFor(async () => {
    await expect(rows).toHaveCount(1);
  });

  const breakpointsTest = rows
    .filter({ hasText: "breakpoints-05: Test interaction of breakpoints with debugger statements" })
    .first();

  // can open tests
  await breakpointsTest.click();
  const selectedRow = getSelectedTestCase(page);
  await waitFor(async () => {
    expect(await selectedRow.isVisible()).toBe(true);
    expect(selectedRow).toHaveCount(1);
  });

  const steps = getTestCaseSteps(selectedRow);

  const stepsWithMaybeJ2C = steps.filter({
    hasText: /click|press/,
  });

  // "Jump to Code" button should jump to the right app line
  const firstJ2CStep = stepsWithMaybeJ2C.nth(0);
  await firstJ2CStep.hover();
  const jumpToCodeButton = getByTestName(firstJ2CStep, "JumpToCode");
  await jumpToCodeButton.hover();
  await jumpToCodeButton.click();

  await waitForSelectedSource(page, "ViewToggle.tsx");
  await waitFor(async () => {
    const lineNumber = await getSelectedLineNumber(page, true);
    expect(lineNumber).toBe(70);
  });

  // Avoid "selected line" locator errors by closing this tab first
  await waitForSelectedSource(page, "ViewToggle.tsx");
  await closeSource(page, "ViewToggle.tsx");

  // Unlike Cypress, we can't jump to the test source.
  // Verify that's disabled.
  await firstJ2CStep.click();
  const menuButton = getByTestName(firstJ2CStep, "TestSectionRowMenuButton");
  await menuButton.click();

  const jumpToSourceMenuItem = page.getByText("Jump to test source");
  expect(await jumpToSourceMenuItem.getAttribute("data-disabled")).toBe("true");

  // hide the context menu
  await page.keyboard.press("Escape");

  await firstJ2CStep.click();
  const pausedTimelinePercent = await getTimelineCurrentPercent(page);

  await menuButton.click();
  await page.getByText("Play to here").click();

  // Should jump backwards and start playing
  await waitFor(async () => {
    const currentTimelinePercent = await getTimelineCurrentPercent(page);
    expect(currentTimelinePercent).toBeLessThan(pausedTimelinePercent);
  });

  // And eventually pause at the same spot
  await waitFor(
    async () => {
      const currentTimelinePercent = await getTimelineCurrentPercent(page);
      expect(currentTimelinePercent).toBe(pausedTimelinePercent);
    },
    { timeout: 30000 }
  );

  await menuButton.click();
  await page.getByText("Show after").click();

  // Should have gone forward a couple seconds
  await waitForTimelineAdvanced(page, pausedTimelinePercent);
});
