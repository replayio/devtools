import { isViewerTabActive, openViewerTab, startTest } from "../helpers";
import {
  getSelectedTestCase,
  getTestCaseSteps,
  getTestRows,
  getTestSuitePanel,
  openPlaywrightTestPanel,
} from "../helpers/testsuites";
import { getTimelineCurrentHoverPercent, getTimelineCurrentPercent } from "../helpers/timeline";
import { waitFor } from "../helpers/utils";
import test, { expect } from "../testFixtureCloneRecording";

test.use({ exampleKey: "playwright/breakpoints-05" });

test("playwright-02: Test Step timeline behavior", async ({
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
  let firstGoToIndex = -1;

  // Get all the timeline values as we hover over steps
  // The first step is 0. All other steps should be greater than 0,
  // and greater than the step percentage before it.
  for (let i = 1; i < numSteps; i++) {
    await steps.nth(i).hover();

    // we won't have annotations until after the first navigation
    if (firstGoToIndex === -1) {
      if (
        (await steps
          .nth(1)
          .filter({ hasText: /page\.goto/ })
          .count()) === 1
      ) {
        firstGoToIndex = i;
      }

      continue;
    }

    const hoverPercent = await getTimelineCurrentHoverPercent(page);
    expect(hoverPercent).toBeGreaterThanOrEqual(lastHoverPercent);

    lastHoverPercent = hoverPercent;
  }

  // We should be in Viewer Mode to start with
  expect(await isViewerTabActive(page)).toBe(true);

  // Clicking a step should move the timeline forward
  const clickableSteps = steps.filter({
    hasText: /click|press|type|count/,
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

    prevPercent = currentPercent;
  }

  // Clicking in viewer mode shouldn't switch to DevTools mode
  expect(await isViewerTabActive(page)).toBe(true);
});
