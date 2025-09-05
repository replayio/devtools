import { startTest } from "../helpers";
import { getGraphicsDataUrl } from "../helpers/screenshot";
import { getTestCaseSteps, getTestRows } from "../helpers/testsuites";
import { waitFor } from "../helpers/utils";
import test, { expect } from "../testFixture";

test.use({ exampleKey: "playwright/breakpoints-05" });

test("repaint-02: repaints on hover", async ({
  pageWithMeta: { page, recordingId, testScope },
}) => {
  await startTest(page, recordingId, testScope);

  const endingScreenShot = await getGraphicsDataUrl(page);

  const testLink = getTestRows(page).first();
  await testLink.click();

  // Wait for the test to open
  await waitFor(async () => {
    await expect(await getGraphicsDataUrl(page)).not.toBe(endingScreenShot);
  });

  // By default, the screenshot shown should correspond to the start of the test
  const startOfTestScreenShot = await getGraphicsDataUrl(page);

  const stepLink = getTestCaseSteps(page).getByText("expect").first();
  await stepLink.hover();

  // Hovering over a test step should update the graphics
  await waitFor(async () => {
    await expect(await getGraphicsDataUrl(page)).not.toBe(startOfTestScreenShot);
  });

  await page.mouse.move(0, 0);

  // When you stop hovering, the screenshot should reset to what it was before
  await waitFor(async () => {
    await expect(await getGraphicsDataUrl(page)).toBe(startOfTestScreenShot);
  });
});
