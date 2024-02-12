import { isViewerTabActive, openDevToolsTab, openViewerTab, startTest } from "../helpers";
import { closeSource, getSelectedLineNumber, waitForSelectedSource } from "../helpers/source-panel";
import {
  getDetailsPaneContents,
  getSelectedTestCase,
  getTestCaseSteps,
  getTestRows,
  getTestStepBeforeAfterButtons,
  getTestSuitePanel,
  getUserActionEventDetails,
  openCypressTestPanel,
} from "../helpers/testsuites";
import { waitForTimelineAdvanced } from "../helpers/timeline";
import { delay, getByTestName, waitFor } from "../helpers/utils";
import test, { expect } from "../testFixtureCloneRecording";

test.use({ exampleKey: "flake/adding-spec.ts" });

test("cypress-03: Test Step interactions", async ({ pageWithMeta: { page, recordingId } }) => {
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

  const addTodosTest = rows.filter({ hasText: "should allow me to add todo items" }).first();

  // can open tests
  await addTodosTest.click();
  const selectedRow = getSelectedTestCase(page);
  await waitFor(async () => {
    expect(await selectedRow.isVisible()).toBe(true);
    expect(selectedRow).toHaveCount(1);
  });

  const steps = getTestCaseSteps(selectedRow);
  const numSteps = await steps.count();
  expect(numSteps).toBe(21);

  // We should be in Viewer Mode to start with
  expect(await isViewerTabActive(page)).toBe(true);

  const clickableSteps = steps.filter({
    hasText: /get|eq|visit|type|click|find/,
  });

  let prevPercent = 0;
  await clickableSteps.nth(0).click();

  // Clicking in viewer mode shouldn't switch to DevTools mode
  expect(await isViewerTabActive(page)).toBe(true);

  // Should show the "Before/After" buttons
  const beforeAfterButtons = getTestStepBeforeAfterButtons(page);
  expect(await beforeAfterButtons.isVisible()).toBe(true);

  const afterButton = beforeAfterButtons.locator("button", { hasText: "After" }).first();

  // Clicking "After" changes the current time
  await afterButton.click();
  prevPercent = await waitForTimelineAdvanced(page, prevPercent);

  const firstGet = clickableSteps.filter({ hasText: /get/ }).first();

  // Jump to the first `get` step
  await firstGet.click();
  prevPercent = await waitForTimelineAdvanced(page, prevPercent);

  // Buttons get hidden for `get` steps
  await waitFor(async () => {
    expect(await beforeAfterButtons.isVisible()).toBe(false);
  });

  const networkStep = steps.filter({ hasText: /localhost/ }).first();
  await networkStep.click();
  // Buttons get hidden for network request steps
  await waitFor(async () => {
    expect(await beforeAfterButtons.isVisible()).toBe(false);
  });
  // Network requests have no details
  await waitFor(async () => {
    const detailsPane = getUserActionEventDetails(page);
    expect(await detailsPane.isVisible()).toBe(false);

    const message = getByTestName(page, "TestEventDetailsMessage");
    const messageContents = await message.textContent();
    expect(messageContents).toMatch("Select an action above to view its details");
  });

  const SPEC_FILE_NAME = "adding-spec.ts";

  await openDevToolsTab(page);

  // Clicking a test step in DevTools mode should open the source
  // and select the line
  await closeSource(page, SPEC_FILE_NAME);

  await firstGet.click();

  await waitForSelectedSource(page, SPEC_FILE_NAME);

  // Should highlight the line with this step
  await waitFor(async () => {
    const lineNumber = await getSelectedLineNumber(page, false);
    expect(lineNumber).toBe(30);
  });

  const firstEq = clickableSteps.filter({ hasText: /eq/ }).first();

  await firstEq.click();

  await waitForSelectedSource(page, SPEC_FILE_NAME);

  // Should highlight the new step's line
  await waitFor(async () => {
    const lineNumber = await getSelectedLineNumber(page, false);
    expect(lineNumber).toBe(31);
  });

  // Clicking each step should change the details pane
  await firstGet.click();
  await waitFor(async () => {
    const detailsPane = getUserActionEventDetails(page);
    const detailsPaneContents = await getDetailsPaneContents(detailsPane);
    expect(detailsPaneContents["Command"]).toBe(`"get"`);
    expect(detailsPaneContents["Selector"]).toBe(`".new-todo"`);
  });

  await steps.nth(8).click();
  await waitFor(async () => {
    const detailsPane = getUserActionEventDetails(page);
    const detailsPaneContents = await getDetailsPaneContents(detailsPane);
    expect(detailsPaneContents["Command"]).toBe(`"type"`);
    expect(detailsPaneContents["Typed"]).toMatch("buy some cheese");
  });

  await steps.nth(9).click();
  await waitFor(async () => {
    const detailsPane = getUserActionEventDetails(page);
    const detailsPaneContents = await getDetailsPaneContents(detailsPane);
    expect(detailsPaneContents["Command"]).toBe(`"type"`);
    expect(detailsPaneContents["Typed"]).toMatch("{enter}");
  });

  await steps.nth(10).click();
  await delay(100);

  await waitFor(async () => {
    const detailsPane = getUserActionEventDetails(page);
    const detailsPaneContents = await getDetailsPaneContents(detailsPane);
    expect(detailsPaneContents["Command"]).toBe(`"get"`);
    expect(detailsPaneContents["Selector"]).toBe(`".todo-list li"`);
  });
});
