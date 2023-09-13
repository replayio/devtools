import { openViewerTab, startTest } from "../helpers";
import { waitForPaused } from "../helpers/pause-information-panel";
import { getSelectedTestCase, getTestCaseSteps, openCypressTestPanel } from "../helpers/testsuites";
import { waitForTimelineAdvanced } from "../helpers/timeline";
import test, { expect } from "../testFixtureCloneRecording";

test.use({ exampleKey: "React Hook Form/conditionalField.cy.ts" });

test("fe-1875 :: verify that steps go to the right point in time", async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openViewerTab(page);

  await openCypressTestPanel(page);

  await page.getByText("should reflect correct form state and data collection").click();

  const selectedRow = getSelectedTestCase(page);
  const steps = getTestCaseSteps(selectedRow);

  const clickableSteps = steps.filter({
    hasText: /type|click/,
  });

  await clickableSteps.nth(0).click();

  const timelinePercent = await waitForTimelineAdvanced(page, 0);
  expect(Math.round(timelinePercent)).toBe(67);

  page.click('[data-test-name="JumpToCode"]');

  await waitForPaused(page, 658);
});
