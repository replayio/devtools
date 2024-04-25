import { openViewerTab, startTest } from "../helpers";
import {
  getSelectedTestCase,
  getTestCaseSteps,
  getTestRows,
  getTestSuitePanel,
  openPlaywrightTestPanel,
} from "../helpers/testsuites";
import { debugPrint, waitFor } from "../helpers/utils";
import test, { expect } from "../testFixture";

test.use({ exampleKey: "playwright/breakpoints-05" });

test("playwright-05: Test DOM node previews on user action step hover", async ({
  pageWithMeta: { page, recordingId, testScope },
  exampleKey,
}) => {
  await startTest(page, recordingId, testScope);
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

  debugPrint(page, "Checking highlighting for one node");

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

  debugPrint(page, "Checking highlighting for multiple nodes");

  // Should also handle multiple found DOM nodes
  const stepWithMultipleNodes = steps
    .filter({
      hasText: `[data-test-name="ScopesList"] >> [data-test-name="Expandable"]`,
    })
    .last();

  // There should now be 4 highlighters in the page,
  // one per found expandable scope DOM node

  await waitFor(
    async () => {
      // Repeatedly hover over the first step and then the actual step, to force the
      // `onMouseEnter` handler to keep checking if we have a DOM node entry available.
      await firstStep.hover({ timeout: 1000 });
      await stepWithMultipleNodes.hover({ timeout: 1000 });
      const count = await highlighter.count();
      await highlighter.first().waitFor({ state: "visible", timeout: 1000 });
      expect(count).toBe(3);
    },
    // Give the evaluation plenty of time to complete
    { timeout: 30000 }
  );

  debugPrint(page, "Checking found nodes badge");

  // Badge doesn't show up until the step is selected
  await stepWithMultipleNodes.click();
  const badge = stepWithMultipleNodes.locator(`[class*="SelectedBadge"]`);
  const badgeText = await badge.innerText();
  expect(badgeText).toBe("3");
});
