import test, { expect } from "@playwright/test";

import { startLibraryTest } from "../../helpers";
import { E2E_USER_3_API_KEY, E2E_USER_3_TEAM_ID } from "../../helpers/authentication";
import {
  filterTestRunsList,
  findTestRunsInList,
  getTestRunAttribute,
  getVisibleBranchNames,
} from "../../helpers/test-suites";

test.skip(`authenticated/test-suites/library-test-runs`, async ({ page }) => {
  await startLibraryTest(page, E2E_USER_3_API_KEY, E2E_USER_3_TEAM_ID);

  await filterTestRunsList(page, { branch: "primary" });
  await expect(await getVisibleBranchNames(page)).toEqual(["main"]);
  await filterTestRunsList(page, { branch: "all" });

  await filterTestRunsList(page, { status: "failed" });
  await expect(await findTestRunsInList(page, { status: "success" }).count()).toBe(0);
  await filterTestRunsList(page, { text: "something that would never exist" });

  await expect(await findTestRunsInList(page, { title: "#9332" }).count()).toBe(0);
  await filterTestRunsList(page, { text: "#9332" });
  await expect(await findTestRunsInList(page).count()).toBe(1);
  await expect(await findTestRunsInList(page, { title: "#9332" }).count()).toBe(1);

  const testRun = await findTestRunsInList(page, {
    title: "github: remove semgrep (#9332)",
  }).first();
  await expect(await getTestRunAttribute(testRun, "Branch").textContent()).toBe("main");
  // Relative dates can change over time.
  // Check for either the "X units ago" text, or the literal date.
  await expect(await getTestRunAttribute(testRun, "Date").textContent()).toMatch(
    / ago|(10\/26\/2023)/
  );
  await expect(await getTestRunAttribute(testRun, "Username").textContent()).toContain("jazzdan");
});
