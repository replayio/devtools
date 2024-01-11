import {
  TEST_RUN_WORKSPACE_API_KEY,
  TEST_RUN_WORKSPACE_TEAM_ID,
} from "../../helpers/authentication";
import { openContextMenu } from "../../helpers/console-panel";
import { selectContextMenuItem } from "../../helpers/context-menu";
import test, { expect } from "../../testFixtureTestRuns";
import {
  filterTestsByText,
  startTest,
  testsItems,
  waitForTestExecutions,
} from "./test-suite.utils";

test.use({ testRunState: "UNIQUE_TESTS_FOR_TESTS_VIEW" });

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

test(`authenticated/new-test-suites/tests-03: test ID in the URL`, async ({
  pageWithMeta: { page },
}) => {
  await startTest(
    page,
    TEST_RUN_WORKSPACE_API_KEY,
    TEST_RUN_WORKSPACE_TEAM_ID,
    btoa("trt:unq-first-test-id")
  );
  expect(await testsItems(page).count()).not.toBe(0);

  await waitForTestExecutions(page);
  expect(await page.locator('[data-test-id="ExecutionItem"]').count()).not.toBe(0);
  //#endregion
});
