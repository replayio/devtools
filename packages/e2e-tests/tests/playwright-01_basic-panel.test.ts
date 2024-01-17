import { debugPrint } from "../helpers/utils";
import { openDevToolsTab, startTest } from "../helpers";
import {

  getSelectedTestCase,
  getTestCaseSteps,
  getTestRecordingBackButton,
  getTestRecordingTrees,
  getTestRowChevron,
  getTestRows,
  getTestSections,
  getTestSuiteBranch,
  getTestSuiteDate,
  getTestSuiteDuration,
  getTestSuitePanel,
  getTestSuiteResultsFailedCount,
  getTestSuiteResultsPassedCount,
  getTestSuiteResultsSkippedCount,
  getTestSuiteUser,
  openCypressTestPanel,
  openPlaywrightTestPanel,
} from "../helpers/testsuites";
import { waitFor } from "../helpers/utils";
import test, { expect } from "../testFixtureCloneRecording";

test.use({ exampleKey: "playwright/breakpoints-05" });

test("playwright-01: Basic Test Suites panel functionality", async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openDevToolsTab(page);

  await openPlaywrightTestPanel(page);

  // These are nested, but at least one should exist
  // on the test suites panel
  let initialRecordingTreesCount = 0;
  const initialRecordingTrees = getTestRecordingTrees(page);
  await waitFor(async () => {
    initialRecordingTreesCount = await initialRecordingTrees.count();
    expect(initialRecordingTreesCount).toBeGreaterThanOrEqual(1);
  });


  debugPrint(page, "has 1 test")
  const rows = getTestRows(page);
  await waitFor(async () => {
    await expect(rows).toHaveCount(1);
  });

  const firstTest = rows.first();

  debugPrint(page, "displays the nav chevron on hover");
  const chevron = getTestRowChevron(firstTest);
  await firstTest.hover();
  await expect(chevron).toBeVisible();

  debugPrint(page, "This recording has 1 passing, 0 failing, 0 skipped tests");
  const passedCount = await getTestSuiteResultsPassedCount(page);
  expect(passedCount).toBe(1);

  const failedCount = await getTestSuiteResultsFailedCount(page);
  expect(failedCount).toBe(0);

  const skippedCount = await getTestSuiteResultsSkippedCount(page);
  expect(skippedCount).toBe(null);

  debugPrint(page, "Test suite metadata");

  // These icons have hidden text content.
  // Simplest way to check is just see if the text exists.

  // Relative dates can change over time.
  // Check for either the "X units ago" text, or the literal date.
  expect(await getTestSuiteDate(page).textContent()).toMatch(/ ago|(10\/19\/2023)/);
  expect(await getTestSuiteUser(page).textContent()).toMatch("hbenl");
  expect(await getTestSuiteBranch(page).textContent()).toMatch("hbenl/fe-1987");
  expect(await getTestSuiteDuration(page).textContent()).toMatch("0:45");

  debugPrint(page, "can open tests");
  await firstTest.click();
  const selectedRow = getSelectedTestCase(page);
  await waitFor(async () => {
    expect(await selectedRow.isVisible()).toBe(true);
    expect(selectedRow).toHaveCount(1);
  });

  debugPrint(page, "This recording only has a \"test body\" section");
  const sections = getTestSections(selectedRow);
  await expect(sections).toHaveCount(1);

  debugPrint(page, "These are CSS-transformed to uppercase");
  expect(await sections.nth(0).textContent()).toMatch(/test body/i);

  const steps = getTestCaseSteps(selectedRow);
  await expect(steps).toHaveCount(231);

  const backButton = getTestRecordingBackButton(page);
  await backButton.click();

  debugPrint(page, "Check if we're back on the main tests panel");
  const secondRecordingTrees = getTestRecordingTrees(page);
  await waitFor(async () => {
    const secondRecordingTreesCount = await secondRecordingTrees.count();
    expect(secondRecordingTreesCount).toBeGreaterThanOrEqual(1);
    expect(initialRecordingTreesCount).toBe(secondRecordingTreesCount);
  });
});
