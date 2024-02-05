import { startLibraryTest } from "../helpers";
import { TEST_RUN_WORKSPACE_API_KEY, TEST_RUN_WORKSPACE_TEAM_ID } from "../helpers/authentication";
import {
  filterRunsByText,
  filterSummaryTestsByText,
  filterTestRunsByBranch,
  findTestRunByText,
  noTestSelected,
  testErrors,
  testItems,
  testRecordings,
  testRunResult,
  testRunSummary,
  testRunsItems,
} from "../helpers/test-suite-dashboard";
import test, { expect } from "../testFixtureTestSuiteDashboard";

test.use({ testRunState: "FAILED_IN_TEMP_BRANCH_WITHOUT_SOURCE" });

test(`test-suite-dashboard/test-runs-02: failed run in temp branch without source`, async ({
  pageWithMeta: { page, clientKey },
}) => {
  await startLibraryTest(page, TEST_RUN_WORKSPACE_API_KEY, TEST_RUN_WORKSPACE_TEAM_ID);
  expect(await testRunsItems(page).count()).not.toBe(0);

  // > List view

  // >>> Filter by primary branch
  await filterTestRunsByBranch(page, clientKey, "show-only-primary-branch");
  expect(await testRunsItems(page).count()).toBe(0);
  await filterTestRunsByBranch(page, "", "show-all-branches");

  // >>> A test run with any failing tests should display a count of the failures to the left of the test run title
  const testRunItemCount = await testRunsItems(page).count();
  let failedRun = await findTestRunByText(page, testRunsItems(page), clientKey);

  const testRunStatusPill = failedRun.locator('[data-test-status="fail"]');
  expect(await testRunStatusPill.count()).toBe(1);
  expect(await testRunStatusPill.innerText()).toBe("2");

  // >>> Run Overview

  // >>> Opens test run overview and match the title
  await filterRunsByText(page, clientKey);

  expect(await testRunsItems(page).count()).toBe(1);
  await testRunsItems(page).first().click();
  await page.waitForSelector('[data-test-id="NoTestRunSelected"]', { state: "detached" });
  expect(await noTestSelected(page).count()).toBe(1);
  expect(await testRunSummary(page).count()).toBe(1);
  expect(await testRunSummary(page).innerText()).toContain(clientKey);

  const overviewTitle = testRunSummary(page).locator('[data-test-id="TestRunSummary-Title"]');
  const testItemTitle = testRunsItems(page).first().locator('[data-test-id="TestRun-Title"]');
  expect(await overviewTitle.innerText()).toContain(await testItemTitle.innerText());

  // >>> The number of failed, flaky, and passing tests should be displayed in a colored box
  const failedPillCount = testRunSummary(page).locator('[data-test-id="Pill-failed"]');
  const flakyPillCount = testRunSummary(page).locator('[data-test-id="Pill-flaky"]');
  const successPillCount = testRunSummary(page).locator('[data-test-id="Pill-success"]');
  expect(await failedPillCount.innerText()).toBe("2");
  expect(await flakyPillCount.innerText()).toBe("3");
  expect(await successPillCount.innerText()).toBe("4");

  // >>> The relative time of the test run creation date should be displayed
  const testRunItemDate = testRunSummary(page).locator('[data-test-id="TestRun-Date"]');
  expect(await testRunItemDate.count()).toBe(1);

  // >>> The test duration should be displayed as the sum of the duration of every test in the run
  const testRunDuration = testRunSummary(page).locator('[data-test-id="TestRun-Duration"]');
  expect(await testRunDuration.count()).toBe(1);
  expect(await testRunDuration.getAttribute("title")).toEqual("1.2s");

  // >>> trigger author, branch name, workflow link pull request number and link should NOT be displayed
  const commitAuthor = testRunSummary(page).locator('[data-test-id="TestRun-Username"]');
  expect(await commitAuthor.count()).toBe(0);

  const testRunBranch = testRunSummary(page).locator('[data-test-id="TestRun-Branch"]');
  expect(await testRunBranch.count()).toBe(0);

  const workflowLink = testRunSummary(page).locator('[data-test-id="TestRun-WorkflowLink"]');
  expect(await workflowLink.count()).toBe(0);

  const pullRequest = testRunSummary(page).locator('[data-test-id="TestRun-PullRequest"]');
  expect(await pullRequest.count()).toBe(0);

  // >>> Failed, Flaky, and Passed tests should be rendered in separate sections
  const failedTests = testRunResult(page).locator(
    '[data-test-id="TestRunResults-StatusGroup-failed"]'
  );
  expect(await failedTests.count()).toBe(1);
  expect(await testItems(failedTests).count()).toBe(2);
  expect(
    await failedTests.locator('[data-test-id="TestRunResults-StatusGroup-Count"]').innerText()
  ).toEqual("2");

  const flakyTests = testRunResult(page).locator(
    '[data-test-id="TestRunResults-StatusGroup-flaky"]'
  );
  expect(await flakyTests.count()).toBe(1);
  expect(await testItems(flakyTests).count()).toBe(3);
  expect(
    await flakyTests.locator('[data-test-id="TestRunResults-StatusGroup-Count"]').innerText()
  ).toEqual("3");

  const successTests = testRunResult(page).locator(
    '[data-test-id="TestRunResults-StatusGroup-passed"]'
  );
  expect(await successTests.count()).toBe(1);
  expect(await testItems(successTests).count()).toBe(4);
  expect(
    await successTests.locator('[data-test-id="TestRunResults-StatusGroup-Count"]').innerText()
  ).toEqual("4");

  // When clicking a selection, the visibility of the groups within that section should toggle.
  // the caret to the right of the section label should animate to the new state
  const testGroup = failedTests
    .locator('[data-test-id="TestRunResults-StatusGroup-Title"]')
    .first();
  await testGroup.click();

  (await testItems(failedTests).all()).forEach(async element => {
    await expect(element).toBeHidden();
  });
  const icon = testGroup.locator('[data-test-id="TestRunResults-StatusGroup-Icon"]');
  expect(await icon.getAttribute("data-test-state")).toEqual("collapsed");
  await testGroup.click();

  // >>> Tests within each section should be grouped by the relative file path of the spec file containing the test.
  // - For example, if a test run includes 3 spec files: `cypress/e2e/root-spec.ts`, `cypress/e2e/auth/comment-spec.ts`, and `cypress/e2e/auth/profile-spec.ts`,
  // - The `cypress/e2e` group would contains `root-spec.ts` and the `auth` group.
  // - The `auth` group would contain `comment-spec.ts` and `profile-spec.ts`

  const testRunResultStatusGroupPassed = testRunResult(page).locator(
    '[data-test-id="TestRunResults-StatusGroup-passed"]'
  );
  expect(await testRunResultStatusGroupPassed.count()).toBe(1);
  const testRunResultPathNode = testRunResultStatusGroupPassed.locator(
    '[data-test-id="TestRunResult-PathNode"]'
  );
  expect(await testRunResultPathNode.count()).toBe(6);
  expect((await testRunResultPathNode.nth(0).innerText()).replace(/\s/g, "")).toBe("cypress/e2e/");
  expect((await testRunResultPathNode.nth(1).innerText()).replace(/\s/g, "")).toBe("auth/");
  const testRunResultFileNode = testItems(testRunResultStatusGroupPassed);
  expect(await testRunResultFileNode.count()).toBe(4);
  expect(await testRunResultFileNode.nth(0).innerText()).toBe(`Second test ${clientKey}`);
  expect(await testRunResultFileNode.nth(0).getAttribute("style")).toBe("padding-left: 5rem;");
  expect(await testRunResultFileNode.nth(1).innerText()).toBe(`Third test ${clientKey}`);
  expect(await testRunResultFileNode.nth(1).getAttribute("style")).toBe("padding-left: 5rem;");
  expect(await testRunResultFileNode.nth(2).innerText()).toBe(`First test ${clientKey}`);
  expect(await testRunResultFileNode.nth(2).getAttribute("style")).toBe("padding-left: 4rem;");

  // >>> Clicking a group, the visibility of the tests within that section should toggle and the caret to the right of the group label should animate to the new state
  const authGroup = testRunResultPathNode.filter({ hasText: "auth" });
  await authGroup.click();

  expect(await authGroup.innerText()).toContain("(2 tests)");
  expect(testItems(authGroup)).not.toBeVisible();
  const authGroupIcon = authGroup.locator('[data-test-id="TestRunResult-PathNode-Icon"]');
  expect(await authGroupIcon.getAttribute("data-test-state")).toEqual("collapsed");
  await authGroup.click();

  // > Test Details

  // >>> When a test is selected, recording list should be displayed
  await testItems(page).filter({ hasText: "Cypress Test" }).first().click();
  await page.waitForSelector('[data-test-id="NoTestSelected"]', { state: "detached" });
  expect(await testRecordings(page).count()).toBe(1);
  expect(await testRecordings(page).nth(0).getAttribute("data-test-status")).toBe("failed");

  // >>> When there's no recording, a message should be displayed
  await testItems(page).filter({ hasText: "Second test" }).click();
  await page.waitForSelector('[data-test-id="NoTestSelected"]', { state: "detached" });
  expect(await testRecordings(page).count()).toBe(0);
  expect(page.locator('[data-test-id="MISSING_REPLAYS_FOR_TEST_RUN"]')).toBeVisible();

  // >>> Errors
  await testItems(failedTests).filter({ hasText: `Cypress Test` }).first().click();
  await page.waitForSelector('[data-test-id="NoTestSelected"]', { state: "detached" });
  expect(await testRecordings(page).count()).toBe(1);
  expect(await testErrors(page).count()).toBe(1);

  await testItems(failedTests).filter({ hasNotText: `Cypress Test` }).first().click();
  await page.waitForSelector('[data-test-id="NoTestSelected"]', { state: "detached" });
  expect(await testRecordings(page).count()).toBe(1);
  expect(await testErrors(page).count()).toBe(1);

  await testItems(flakyTests).first().click();
  await page.waitForSelector('[data-test-id="NoTestSelected"]', { state: "detached" });
  expect(await testRecordings(page).count()).toBe(1);
  expect(await testErrors(page).count()).toBe(1);

  // >>> When a test was selected but omitted due to a change in filter, the test run test details view should show a message
  await filterSummaryTestsByText(page, "something that would never exist");
  expect(await testItems(page).count()).toBe(0);
  expect(await noTestSelected(page).count()).toBe(1);
  await filterSummaryTestsByText(page, "");
});
