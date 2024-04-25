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
import test, { expect } from "../testFixture";

test.use({ exampleKey: "playwright/breakpoints-05" });

test("playwright-01: Basic Test Suites panel functionality", async ({
  pageWithMeta: { page, recordingId, testScope },
  exampleKey,
}) => {
  await startTest(page, recordingId, testScope);
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

  // has 1 test
  const rows = getTestRows(page);
  await waitFor(async () => {
    await expect(rows).toHaveCount(1);
  });

  const firstTest = rows.first();

  // displays the nav chevron on hover
  const chevron = getTestRowChevron(firstTest);
  await firstTest.hover();
  await expect(chevron).toBeVisible();

  // This recording has 1 passing, 0 failing, 0 skipped tests
  const passedCount = await getTestSuiteResultsPassedCount(page);
  expect(passedCount).toBe(1);

  const failedCount = await getTestSuiteResultsFailedCount(page);
  expect(failedCount).toBe(0);

  const skippedCount = await getTestSuiteResultsSkippedCount(page);
  expect(skippedCount).toBe(null);

  // Test suite metadata

  // These icons have hidden text content.
  // Simplest way to check is just see if the text exists.

  // Relative dates can change over time.
  // Check for either the "X units ago" text, or the literal date.
  expect(await getTestSuiteDate(page).textContent()).toMatch(/ ago|(1\/26\/2024)/);
  expect(await getTestSuiteUser(page).textContent()).toMatch("hbenl");
  expect(await getTestSuiteBranch(page).textContent()).toMatch("main");
  expect(await getTestSuiteDuration(page).textContent()).toMatch(/0:\d{2}/);

  // can open tests
  await firstTest.click();
  const selectedRow = getSelectedTestCase(page);
  await waitFor(async () => {
    expect(await selectedRow.isVisible()).toBe(true);
    expect(selectedRow).toHaveCount(1);
  });

  // This recording only has a "test body" section
  const sections = getTestSections(selectedRow);
  await expect(sections).toHaveCount(1);

  // These are CSS-transformed to uppercase
  expect(await sections.nth(0).textContent()).toMatch(/test body/i);

  const steps = getTestCaseSteps(selectedRow);
  const stepCount = await steps.count();
  await expect(stepCount).toBeGreaterThan(200);

  const backButton = getTestRecordingBackButton(page);
  await backButton.click();

  // Check if we're back on the main tests panel
  const secondRecordingTrees = getTestRecordingTrees(page);
  await waitFor(async () => {
    const secondRecordingTreesCount = await secondRecordingTrees.count();
    expect(secondRecordingTreesCount).toBeGreaterThanOrEqual(1);
    expect(initialRecordingTreesCount).toBe(secondRecordingTreesCount);
  });
});
