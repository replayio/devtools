import { openDevToolsTab, openViewerTab, startTest } from "../helpers";
import { closeSource, getSelectedLineNumber, waitForSelectedSource } from "../helpers/source-panel";
import {
  getSelectedTestCase,
  getTestCaseSteps,
  getTestRows,
  getTestSuitePanel,
  openCypressTestPanel,
} from "../helpers/testsuites";
import { getTimelineCurrentPercent, waitForTimelineAdvanced } from "../helpers/timeline";
import { getByTestName, waitFor } from "../helpers/utils";
import test, { expect } from "../testFixture";

test.use({ exampleKey: "cypress-realworld/bankaccounts.spec.js" });

test("cypress-04: Test Step buttons and menu item", async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openViewerTab(page);

  await openCypressTestPanel(page);

  await openDevToolsTab(page);

  const testPanel = getTestSuitePanel(page);

  const isVisible = await testPanel.isVisible();
  expect(isVisible).toBe(true);

  // has 4 tests
  const rows = getTestRows(page);
  await waitFor(async () => {
    await expect(rows).toHaveCount(4);
  });

  const addAccountTest = rows.filter({ hasText: "creates a new bank account" }).first();

  await addAccountTest.click();
  const selectedRow = getSelectedTestCase(page);
  await waitFor(async () => {
    expect(await selectedRow.isVisible()).toBe(true);
    expect(selectedRow).toHaveCount(1);
  });

  const steps = getTestCaseSteps(selectedRow);

  const stepsWithMaybeJ2C = steps.filter({
    hasText: /click|type/,
  });

  // "Jump to Code" button should jump to the right app line
  const firstJ2CStep = stepsWithMaybeJ2C.nth(0);
  await firstJ2CStep.hover();
  const jumpToCodeButton = getByTestName(firstJ2CStep, "JumpToCode");
  await jumpToCodeButton.hover();
  await jumpToCodeButton.click();

  await waitForSelectedSource(page, "Link.js");
  await waitFor(async () => {
    const lineNumber = await getSelectedLineNumber(page, true);
    expect(lineNumber).toBe(38);
  });

  // Avoid "selected line" locator errors by closing this tab first
  await waitForSelectedSource(page, "Link.js");
  await closeSource(page, "Link.js");

  await firstJ2CStep.hover({ position: { x: 0, y: 0 } });

  // "Jump to Test Source" menu item should jump to the test line
  await firstJ2CStep.click();

  const TEST_SPEC_NAME = "bankaccounts.spec.ts";

  // Got opened when we clicked on the test step,
  // make sure it's closed so we can try out the menu item
  await waitForSelectedSource(page, TEST_SPEC_NAME);
  await closeSource(page, TEST_SPEC_NAME);

  const menuButton = getByTestName(firstJ2CStep, "TestSectionRowMenuButton");

  await menuButton.click();
  await page.getByText("Jump to test source").click();

  await waitForSelectedSource(page, TEST_SPEC_NAME);
  await waitFor(async () => {
    const lineNumber = await getSelectedLineNumber(page, false);
    expect(lineNumber).toBe(47);
  });

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
    { timeout: 15000 }
  );

  await menuButton.click();
  await page.getByText("Show after").click();

  // Should have gone forward a couple seconds
  await waitForTimelineAdvanced(page, pausedTimelinePercent);
});
