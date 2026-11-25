import { startTest } from "../helpers";
import { getGraphicsDataUrl, getGraphicsTime } from "../helpers/screenshot";
import { getTestCaseSteps, getTestRows } from "../helpers/testsuites";
import { seekToTimePercent } from "../helpers/timeline";
import { waitFor } from "../helpers/utils";
import test, { expect } from "../testFixture";

test.use({ exampleKey: "playwright/stepping-02" });

test("repaint-03: repaints on seek", async ({ pageWithMeta: { page, recordingId, testScope } }) => {
  await startTest(page, recordingId, testScope);

  const endingScreenShot = await getGraphicsDataUrl(page);

  const testLink = getTestRows(page).first();
  await testLink.click();

  // The start of the test is before the page's first paint, so select a step after it
  const steps = getTestCaseSteps(page);
  await steps.filter({ hasText: /click/ }).first().click();

  let firstStepTime: number | null = null;
  let firstStepScreenShot: string | null = null;
  await waitFor(async () => {
    firstStepScreenShot = await getGraphicsDataUrl(page);
    await expect(firstStepScreenShot).toMatch(/^data:image\//);
    await expect(firstStepScreenShot).not.toBe(endingScreenShot);
    firstStepTime = await getGraphicsTime(page);
  });

  await steps.getByText("expect").last().click();

  // Selecting a later step should update the graphics
  await waitFor(async () => {
    await expect(await getGraphicsTime(page)).not.toBe(firstStepTime);
    const dataUrl = await getGraphicsDataUrl(page);
    await expect(dataUrl).toMatch(/^data:image\//);
    await expect(dataUrl).not.toBe(firstStepScreenShot);
  });

  // Seeking to the end of the recording should update the graphics
  // even though this is outside of the focus window (and pause creation will fail)
  await seekToTimePercent(page, 100);
  await waitFor(async () => {
    await expect(await getGraphicsDataUrl(page)).toBe(endingScreenShot);
  });
});
