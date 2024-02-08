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

  await page
    .getByRole("listitem")
    .getByText("should reflect correct form state and data collection")
    .click();

  const selectedRow = getSelectedTestCase(page);
  const steps = getTestCaseSteps(selectedRow);

  const clickableSteps = steps.filter({
    hasText: /type|click/,
  });

  await clickableSteps.nth(0).click();

  let timelinePercent = await waitForTimelineAdvanced(page, 0);
  expect(Math.round(timelinePercent)).toBe(72);

  page.click('[data-test-name="JumpToCode"]');

  await waitForPaused(page, 652);

  await openCypressTestPanel(page);
  await clickableSteps.nth(2).click();

  timelinePercent = await waitForTimelineAdvanced(page, timelinePercent + 1);
  expect(Math.round(timelinePercent)).toBe(79);

  await waitForPaused(page, 227);

  await openCypressTestPanel(page);
  page.click('[data-test-name="JumpToCode"]');

  await waitForPaused(page, 1019);
});
