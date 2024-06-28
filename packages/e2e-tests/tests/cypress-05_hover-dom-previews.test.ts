import { openDevToolsTab, openViewerTab, startTest } from "../helpers";
import {
  getSelectedTestCase,
  getTestCaseSteps,
  getTestRows,
  getTestSuitePanel,
  openCypressTestPanel,
} from "../helpers/testsuites";
import { debugPrint, getByTestName, waitFor } from "../helpers/utils";
import test, { expect } from "../testFixture";

test.use({ exampleKey: "cypress-realworld/bankaccounts.spec.js" });

test("cypress-05: Test DOM node preview on user action step hover", async ({
  pageWithMeta: { page, recordingId, testScope },
  exampleKey,
}) => {
  await startTest(page, recordingId, testScope);
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
  const firstStep = steps.first();

  // Others are probably actions too, but we know these are here
  const userActionSteps = steps.filter({
    hasText: /click|type/,
  });

  debugPrint(page, "Checking highlighting for one node");

  // Hovering over a user action step should show a preview of the DOM node
  const firstClickStep = userActionSteps.first();

  // Note that the ID is dynamically generated based on the piece of the box model shown
  const highlighter = page.locator("#box-model-content");

  await waitFor(
    async () => {
      // Repeatedly hover over the first step and then the click step, to force the
      // `onMouseEnter` handler to keep checking if we have a DOM node entry available.
      await firstStep.hover({ timeout: 1000 });
      await firstClickStep.hover({ timeout: 1000 });
      await highlighter.waitFor({ state: "visible", timeout: 1000 });
    },
    // Give the evaluation plenty of time to complete
    { timeout: 30000 }
  );

  const pathDefinition = await highlighter.getAttribute("d");
  // Should have a meaningful SVG path of some kind for the highlighter
  expect(pathDefinition).toBeTruthy();

  // Select `firstClickStep`
  await firstClickStep.click();
  await waitFor(async () =>
    expect(await firstClickStep.getAttribute("data-selected")).toBe("true")
  );

  debugPrint(page, "Checking recorded cursor location for a click");
  const recordedCursor = getByTestName(page, "recorded-cursor");

  function getCursorAttributes(node: HTMLElement) {
    return {
      cursorDisplay: node.dataset.cursorDisplay,
      clickDisplay: node.dataset.clickDisplay,
      clientX: node.dataset.clientX,
      clientY: node.dataset.clientY,
    };
  }
  const clickCursorAttributes = await recordedCursor.evaluate(getCursorAttributes);

  expect(clickCursorAttributes).toEqual({
    cursorDisplay: "true",
    clickDisplay: "true",
    // Read directly from the mouse event in this test
    clientX: "323",
    clientY: "245",
  });

  // Make the highlighter go away
  await firstStep.hover();
  await highlighter.waitFor({ state: "hidden" });
  // Hover over the selected `firstClickStep` and verify that the highlighter is shown again
  await firstClickStep.hover();
  await highlighter.waitFor({ state: "visible" });

  debugPrint(page, "Checking recorded cursor location after a click has finished");

  const openedBankAccountsStep = steps
    .filter({
      hasText: "Opened http://localhost:3000/bankaccounts",
    })
    .first();
  await openedBankAccountsStep.hover();

  const afterClickCursorAttributes = await recordedCursor.evaluate(getCursorAttributes);

  expect(afterClickCursorAttributes).toEqual({
    cursorDisplay: "true",
    // No click display after the click has finished
    clickDisplay: "false",
    // Read directly from the mouse event in this test
    clientX: "323",
    clientY: "245",
  });

  debugPrint(page, "Checking highlighting for multiple nodes");

  // Should also handle multiple found DOM nodes
  const stepWithMultipleNodes = steps
    .filter({
      hasText: "[data-test*=bankaccount-list-item]",
    })
    .first();

  // There should now be 2 highlighters in the page,
  // one per found list item DOM node

  await waitFor(
    async () => {
      // Repeatedly hover over the first step and then the actual step, to force the
      // `onMouseEnter` handler to keep checking if we have a DOM node entry available.
      await firstStep.hover({ timeout: 1000 });
      await stepWithMultipleNodes.hover({ timeout: 1000 });
      const count = await highlighter.count();
      await highlighter.first().waitFor({ state: "visible", timeout: 1000 });
      expect(count).toBe(2);
    },
    // Give the evaluation plenty of time to complete
    { timeout: 30000 }
  );

  debugPrint(page, "Checking found nodes badge");

  // Badge doesn't show up until the step is selected
  await stepWithMultipleNodes.click();
  const badge = stepWithMultipleNodes.locator(`[class*="SelectedBadge"]`);
  const badgeText = await badge.innerText();
  expect(badgeText).toBe("2");
});
