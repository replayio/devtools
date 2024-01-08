import {
  TEST_RUN_WORKSPACE_API_KEY,
  TEST_RUN_WORKSPACE_TEAM_ID,
} from "../../helpers/authentication";
import { openContextMenu } from "../../helpers/console-panel";
import { selectContextMenuItem } from "../../helpers/context-menu";
import test, { expect } from "../../testFixtureTestRuns";
import {
  filterTestsByText,
  findTestByText,
  noTestMatches,
  noTestSelected,
  sortTestsBy,
  startTest,
  testsItems,
  waitForTestExecutions,
} from "./test-suite.utils";

test.use({ testRunState: "UNIQUE_TESTS_FOR_TESTS_VIEW" });

test(`authenticated/new-test-suites/tests-01: basic tests`, async ({ pageWithMeta: { page } }) => {
  await startTest(page, TEST_RUN_WORKSPACE_API_KEY, TEST_RUN_WORKSPACE_TEAM_ID);
  expect(await testsItems(page).count()).not.toBe(0);

  //#region > Test runs list
  const rateSortDropdown = page.locator('[data-test-id="TestPage-ResultFilter-DropdownTrigger"]');

  //#region >>> Each test should be displayed in the first column by title
  expect(await testsItems(page).count()).not.toBe(0);
  await filterTestsByText(page, "cypress-spec-uniq.ts");
  expect(await testsItems(page).count()).toBe(1);
  expect(await testsItems(page).first().locator('[data-test-id="Test-Title"]').innerText()).toEqual(
    "cypress-spec-uniq.ts"
  );

  await filterTestsByText(page, "Tests View -");
  expect(await testsItems(page).count()).toBe(6);
  //#endregion

  //#region >>> Sort by flaky rate
  await sortTestsBy(page, "flakyRate");
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
  expect(await testsItems(page).first().innerText()).toContain("Tests View - Fifth test");
  //#endregion

  //#region >>> Filter search result - no results
  await filterTestsByText(page, "something that would never exist");
  expect(await testsItems(page).count()).toBe(0);
  expect(await noTestMatches(page).count()).toBe(1);
  expect(await noTestSelected(page).count()).toBe(1);
  //#endregion

  //#region >>> Filter search result - specific result
  const testName = "Tests View - Sixth test";
  const commitTitle = "Flaky run in main branch";
  await filterTestsByText(page, testName);
  expect(await testsItems(page).count()).toBe(1);
  const testItem = testsItems(page).first();
  expect(await testItem.innerText()).toContain(testName);
  //#endregion
  //#endregion

  //#region >>> List of executions
  const testItemWithExecutions = await findTestByText(page, testName);
  await testItemWithExecutions.click();
  await waitForTestExecutions(page);

  //#region >>> The test name should be displayed in the title
  expect(await page.locator('[data-test-id="TestOverviewTitle"]').innerText()).toContain(testName);
  //#endregion

  //#region >>> Execution details should be displayed
  expect(await page.locator('[data-test-id="ExecutionItem"]').count()).not.toBe(0);
  const executionItem = page.locator('[data-test-id="ExecutionItem"]').first();
  expect(await executionItem.locator('[data-test-id="ExecutionTitle"]').innerText()).toContain(
    commitTitle
  );
  expect(
    await executionItem.locator('[data-test-id="ExecutionStatusIcon"]').getAttribute("title")
  ).toBe("failed");
  expect(await executionItem.locator('[data-test-id="CommitAuthor"]').innerText()).toContain(
    "test-user-commit"
  );
  expect(await executionItem.locator('[data-test-id="ExecutionDate"]').innerText()).not.toBe("");
  //#endregion

  //#region >>> Replay list
  expect(await executionItem.locator('[data-test-id="ReplayTitle"]').nth(1).innerText()).toContain(
    "Initial attempt"
  );
  expect(await executionItem.locator('[data-test-id="ReplayTitle"]').nth(0).innerText()).toContain(
    "Attempt 2"
  );
  //#endregion

  //#region >>> If a commit did not upload any replays, it should not be displayed
  await filterTestsByText(page, "Tests View - Second test");
  await testsItems(page).first().click();
  await waitForTestExecutions(page);
  expect(await page.locator('[data-test-id="ExecutionItem"]').count()).toBe(0);
  //#endregion

  //#endregion
});
