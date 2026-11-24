import { startTest } from "../helpers";
import { getGraphicsDataUrl, getGraphicsTime } from "../helpers/screenshot";
import { getTestCaseSteps, getTestRows } from "../helpers/testsuites";
import { waitFor } from "../helpers/utils";
import test, { expect } from "../testFixture";

test.use({ exampleKey: "playwright/stepping-02" });

test("repaint-02: repaints on hover", async ({
  pageWithMeta: { page, recordingId, testScope },
}) => {
  await startTest(page, recordingId, testScope);

  const testLink = getTestRows(page).first();
  await testLink.click();

  // The start of the test is before the page's first paint, so select a step after it
  const steps = getTestCaseSteps(page);
  await steps.filter({ hasText: /click/ }).first().click();

  let selectedTime: number | null = null;
  let selectedScreenShot: string | null = null;
  await waitFor(async () => {
    selectedScreenShot = await getGraphicsDataUrl(page);
    await expect(selectedScreenShot).toMatch(/^data:image\//);
    selectedTime = await getGraphicsTime(page);
  });

  await steps.getByText("expect").last().hover();

  // Hovering over a test step should show the graphics for that step
  let hoveredScreenShot: string | null = null;
  await waitFor(async () => {
    await expect(await getGraphicsTime(page)).not.toBe(selectedTime);
    hoveredScreenShot = await getGraphicsDataUrl(page);
    await expect(hoveredScreenShot).toMatch(/^data:image\//);
    await expect(hoveredScreenShot).not.toBe(selectedScreenShot);
  });

  await page.mouse.move(0, 0);

  // When you stop hovering, the graphics should go back to the selected step.
  // Compare times rather than images: a repaint may replace the cached paint shown earlier.
  await waitFor(async () => {
    await expect(await getGraphicsTime(page)).toBe(selectedTime);
    const dataUrl = await getGraphicsDataUrl(page);
    await expect(dataUrl).toMatch(/^data:image\//);
    await expect(dataUrl).not.toBe(hoveredScreenShot);
  });
});
