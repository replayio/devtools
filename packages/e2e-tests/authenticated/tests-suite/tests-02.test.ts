import {
  TEST_RUN_WORKSPACE_API_KEY,
  TEST_RUN_WORKSPACE_TEAM_ID,
} from "../../helpers/authentication";
import { openContextMenu } from "../../helpers/console-panel";
import { selectContextMenuItem } from "../../helpers/context-menu";
import test, { expect } from "../../testFixtureTestRuns";
import {
  filterTestsByText,
  sortTestsBy,
  startTest,
  testsItems,
  waitForTestExecutions,
} from "./test-suite.utils";

test.use({ testRunState: "TEST_WITH_NO_RECORDINGS" });

test(`authenticated/new-test-suites/tests-02: test with no recording`, async ({
  pageWithMeta: { page },
}) => {
  await startTest(page, TEST_RUN_WORKSPACE_API_KEY, TEST_RUN_WORKSPACE_TEAM_ID);
  expect(await testsItems(page).count()).not.toBe(0);

  //#region > Should not show executions list when there are no recordings
  await sortTestsBy(page, "alphabetical");
  await filterTestsByText(page, "Empty run");
  expect(await testsItems(page).count()).toBe(1);
  await testsItems(page).first().click();

  await waitForTestExecutions(page);
  expect(await page.locator('[data-test-id="ExecutionItem"]').count()).toBe(0);
  //#endregion
});
