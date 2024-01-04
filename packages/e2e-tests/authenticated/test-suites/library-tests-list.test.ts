import test, { expect } from "@playwright/test";

import { startLibraryTest } from "../../helpers";
import { E2E_USER_3_API_KEY, E2E_USER_3_TEAM_ID } from "../../helpers/authentication";
import {
  filterTestRecordingList,
  filterTestRunsList,
  findTestRecordingsInTree,
  findTestRecordingsTreeFileNodes,
  findTestRecordingsTreePathNodes,
  findTestResultsStatusCount,
  findTestResultsStatusGroup,
  findTestRunsInList,
  getTestRunAttribute,
  getTestRunSummary,
} from "../../helpers/test-suites";

test.skip(`authenticated/test-suites/library-tests-list`, async ({ page }) => {
  await startLibraryTest(page, E2E_USER_3_API_KEY, E2E_USER_3_TEAM_ID);

  await new Promise(resolve => setTimeout(resolve, 1_000));

  // Select a test
  await filterTestRunsList(page, { text: "#9332" });
  const testRun = await findTestRunsInList(page, {
    title: "github: remove semgrep (#9332)",
  }).first();
  await testRun.click();

  // Verify run summary header contains
  const runSummary = getTestRunSummary(page);
  await expect(await runSummary.textContent()).toContain("github: remove semgrep (#9332)");
  await expect(await getTestRunAttribute(runSummary, "Branch").textContent()).toBe("main");
  // Relative dates can change over time.
  // Check for either the "X units ago" text, or the literal date.
  await expect(await getTestRunAttribute(runSummary, "Date").textContent()).toMatch(
    / ago|(10\/26\/2023)/
  );
  await expect(await getTestRunAttribute(runSummary, "Duration").textContent()).toContain(
    "1h 19m 3.6s"
  );
  await expect(await getTestRunAttribute(runSummary, "Username").textContent()).toContain(
    "jazzdan"
  );

  // Verify filtering works
  await filterTestRecordingList(page, { text: "resizable-panels" });
  await expect(await findTestRecordingsInTree(page).count()).toBe(1);
  await expect(await findTestRecordingsInTree(page, { title: "resizable-panels" }).count()).toBe(1);

  // Verify the tree contains 5 flaky tests, 13 total recordings (including retries)
  await filterTestRecordingList(page, { text: "" });
  await expect(await findTestResultsStatusCount(page, "flaky")).toBe(5);
  await expect(await findTestRecordingsInTree(page, { status: "flaky" }).count()).toBe(13);

  // Verify test (retries) are grouped and can be collapsed
  const flakyGroup = findTestResultsStatusGroup(page, "flaky");
  const fileNodeLocator = findTestRecordingsTreeFileNodes(flakyGroup, {
    text: "comments-02.test.ts",
  });
  const testRetriesLocator = findTestRecordingsInTree(flakyGroup, { title: "comments-02.test.ts" });
  await expect(await testRetriesLocator.count()).toBe(8);
  await fileNodeLocator.click();
  await expect(await fileNodeLocator.textContent()).toContain("8 tests");
  await fileNodeLocator.click();
  await expect(await fileNodeLocator.textContent()).not.toContain("8 tests");

  // Verify folders contain tests and can be collapsed
  const pathNodeLocator = findTestRecordingsTreePathNodes(flakyGroup, { text: "authenticated" });
  await pathNodeLocator.click();
  await expect(await pathNodeLocator.textContent()).toContain("3 tests");
  await pathNodeLocator.click();
  await expect(await pathNodeLocator.textContent()).not.toContain("3 tests");
});
