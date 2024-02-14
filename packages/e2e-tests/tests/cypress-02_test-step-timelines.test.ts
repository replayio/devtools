import { isViewerTabActive, openViewerTab, startTest } from "../helpers";
import {
  getSelectedTestCase,
  getTestCaseSteps,
  getTestRows,
  getTestSuitePanel,
  openCypressTestPanel,
} from "../helpers/testsuites";
import { getTimelineCurrentHoverPercent, getTimelineCurrentPercent } from "../helpers/timeline";
import { waitFor } from "../helpers/utils";
import test, { expect } from "../testFixtureCloneRecording";

test.use({ exampleKey: "flake/adding-spec.ts" });

test("cypress-02: Test Step timeline behavior", async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openViewerTab(page);

  await openCypressTestPanel(page);

  const testPanel = getTestSuitePanel(page);

  const isVisible = await testPanel.isVisible();
  expect(isVisible).toBe(true);

  // has 9 tests
  const rows = getTestRows(page);
  await waitFor(async () => {
    await expect(rows).toHaveCount(9);
  });

  const firstTest = rows.first();

  // can open tests
  await firstTest.click();
  const selectedRow = getSelectedTestCase(page);
  await waitFor(async () => {
    expect(await selectedRow.isVisible()).toBe(true);
    expect(selectedRow).toHaveCount(1);
  });

  const steps = getTestCaseSteps(selectedRow);

  const numSteps = await steps.count();

  let lastHoverPercent = 0;

  // Get all the timeline values as we hover over steps
  // The first step is 0. All other steps should be greater than 0,
  // and greater than the step percentage before it.
  for (let i = 1; i < numSteps; i++) {
    await steps.nth(i).hover();
    const hoverPercent = await getTimelineCurrentHoverPercent(page);
    expect(hoverPercent).toBeGreaterThan(0);
    expect(hoverPercent).toBeGreaterThan(lastHoverPercent);
  }

  // We should be in Viewer Mode to start with
  expect(await isViewerTabActive(page)).toBe(true);

  // Clicking a step should move the timeline forward
  const clickableSteps = steps.filter({
    hasText: /get|eq|visit|type|click|find/,
  });

  const numClickableSteps = await clickableSteps.count();

  let prevPercent = 0;
  await clickableSteps.nth(0).click();

  // Do just a few of these
  for (let i = 0; i < Math.min(5, numClickableSteps); i++) {
    await clickableSteps.nth(i).click();
    const currentPercent = await getTimelineCurrentPercent(page);

    expect(currentPercent).toBeGreaterThan(0);
    expect(currentPercent).toBeGreaterThanOrEqual(prevPercent);
    expect(currentPercent).toBeGreaterThan(lastHoverPercent);

    prevPercent = currentPercent;
  }

  // Clicking in viewer mode shouldn't switch to DevTools mode
  expect(await isViewerTabActive(page)).toBe(true);
});
