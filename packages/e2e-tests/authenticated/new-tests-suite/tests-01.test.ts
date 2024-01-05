import {
  TEST_RUN_WORKSPACE_API_KEY,
  TEST_RUN_WORKSPACE_TEAM_ID,
} from "../../helpers/authentication";
import { openContextMenu } from "../../helpers/console-panel";
import { selectContextMenuItem } from "../../helpers/context-menu";
import test, { expect } from "../../testFixtureTestRuns";
import {
  filterTestsByText,
  noTestMatches,
  noTestSelected,
  startTest,
  testsItems,
  waitForTestRunResults,
} from "./test-suite.utils";

test.use({ testRunState: "UNIQUE_TESTS_FOR_TESTS_VIEW" });

test(`authenticated/new-test-suites/tests`, async ({ pageWithMeta: { page, clientKey } }) => {
  await startTest(page, TEST_RUN_WORKSPACE_API_KEY, TEST_RUN_WORKSPACE_TEAM_ID);
  expect(await testsItems(page).count()).not.toBe(0);

  //#region > Test runs list
  const rateSortDropdown = page.locator('[data-test-id="TestPage-ResultFilter-DropdownTrigger"]');

  //#region >>> Sort by flaky rate
  await openContextMenu(rateSortDropdown, { useLeftClick: true });
  await selectContextMenuItem(page, {
    contextMenuItemTestId: "flakyRate",
  });
  expect(await testsItems(page, "failure").count()).toBe(0);
  expect(await testsItems(page, "flaky").count()).not.toBe(0);
  //#endregion

  //#region >>> Sort by failure rate
  openContextMenu(rateSortDropdown, { useLeftClick: true });
  await selectContextMenuItem(page, {
    contextMenuItemTestId: "failureRate",
  });
  expect(await testsItems(page, "failure").count()).not.toBe(0);
  expect(await testsItems(page, "flaky").count()).toBe(0);
  //#endregion

  //#region >>> Sort alphabetically
  await openContextMenu(rateSortDropdown, { useLeftClick: true });
  await selectContextMenuItem(page, {
    contextMenuItemTestId: "alphabetical",
  });
  expect(await testsItems(page, "failure").count()).not.toBe(0);
  expect(await testsItems(page).first().innerText()).toContain("authenticated/comments-01");
  //#endregion

  //#region >>> Filter search result - no results
  await filterTestsByText(page, "something that would never exist");
  expect(await testsItems(page).count()).toBe(0);
  expect(await noTestMatches(page).count()).toBe(1);
  expect(await noTestSelected(page).count()).toBe(1);
  //#endregion

  //#region >>> Filter search result - specific result
  await filterTestsByText(page, "logpoints-03_chromium");
  expect(await testsItems(page).count()).toBe(1);
  const testItem = testsItems(page).first();
  expect(await testItem.innerText()).toContain("logpoints-03_chromium");
  await filterTestsByText(page, "");
  //#endregion

  //#region >>> List of executions
  const testItemWithExecutions = testsItems(page).first();
  await testItemWithExecutions.click();
  await waitForTestRunResults(page);
  expect(await page.locator('[data-test-id="ExecutionItem"]').count()).not.toBe(0);
  //#endregion

  //#endregion
});
