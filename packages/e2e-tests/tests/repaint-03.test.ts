import { startTest } from "../helpers";
import { getGraphicsDataUrl } from "../helpers/screenshot";
import { getTestCaseSteps, getTestRows } from "../helpers/testsuites";
import { getFocusBeginTime, seekToTimePercent } from "../helpers/timeline";
import { waitFor } from "../helpers/utils";
import test, { expect } from "../testFixtureCloneRecording";

test.use({ exampleKey: "playwright/breakpoints-05" });

test("repaint-03: repaints on seek", async ({ pageWithMeta: { page, recordingId } }) => {
  await startTest(page, recordingId);

  const endingScreenShot = await getGraphicsDataUrl(page);
  const initialFocusBeginTime = await getFocusBeginTime(page);

  const testLink = getTestRows(page).first();
  await testLink.click();

  // Wait for the test to open and focus
  await waitFor(async () => {
    await expect(await getFocusBeginTime(page)).not.toBe(initialFocusBeginTime);
  });

  // By default, the screenshot shown should correspond to the start of the test
  const startOfTestScreenShot = await getGraphicsDataUrl(page);

  const stepLink = getTestCaseSteps(page).getByText("expect").first();
  await stepLink.click();

  // Wait for the graphics to update
  await waitFor(async () => {
    await expect(await getGraphicsDataUrl(page)).not.toBe(startOfTestScreenShot);
  });

  // Seeking to the end of the recording should update the graphics
  // even though this is outside of the focus window (and pause creation will fail)
  await seekToTimePercent(page, 100);
  await waitFor(async () => {
    await expect(await getGraphicsDataUrl(page)).toBe(endingScreenShot);
  });
});
