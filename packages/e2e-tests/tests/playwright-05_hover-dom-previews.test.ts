import { openViewerTab, startTest } from "../helpers";
import {
  getSelectedTestCase,
  getTestCaseSteps,
  getTestRows,
  getTestSuitePanel,
  openPlaywrightTestPanel,
} from "../helpers/testsuites";
import { waitFor } from "../helpers/utils";
import test, { expect } from "../testFixtureCloneRecording";

test.use({ exampleKey: "playwright/breakpoints-05" });

test("playwright-05: Test DOM node previews on user action step hover", async ({
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

  await breakpointsTest.click();
  const selectedRow = getSelectedTestCase(page);
  await waitFor(async () => {
    expect(await selectedRow.isVisible()).toBe(true);
    expect(selectedRow).toHaveCount(1);
  });

  const steps = getTestCaseSteps(selectedRow);
  const firstStep = steps.first();

  const userActionSteps = steps.filter({
    hasText: /click/,
  });

  // Hovering over a user action step should show a preview of the DOM node
  const lastClickStep = userActionSteps.last();
  await lastClickStep.scrollIntoViewIfNeeded();

  // Note that the ID is dynamically generated based on the piece of the box model shown
  const highlighter = page.locator("#box-model-content");

  await waitFor(
    async () => {
      // Repeatedly hover over the first step and then the click step, to force the
      // `onMouseEnter` handler to keep checking if we have a DOM node entry available.
      await firstStep.hover({ timeout: 1000 });
      await lastClickStep.hover({ timeout: 1000 });
      await highlighter.waitFor({ state: "visible", timeout: 1000 });
    },
    // Give the evaluation plenty of time to complete
    { timeout: 60000 }
  );

  const pathDefinition = await highlighter.getAttribute("d");
  // Should have a meaningful SVG path of some kind for the highlighter
  expect(pathDefinition).toBeTruthy();

  // Select `firstClickStep`
  await lastClickStep.click();
  await waitFor(async () => expect(await lastClickStep.getAttribute("data-selected")).toBe("true"));
  // Make the highlighter go away
  await firstStep.hover();
  await highlighter.waitFor({ state: "hidden" });

  // Hover over the selected `firstClickStep` and verify that the highlighter is shown again
  await lastClickStep.hover();
  await highlighter.waitFor({ state: "visible" });
});
