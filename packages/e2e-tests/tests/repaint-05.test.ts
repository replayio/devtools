import { openDevToolsTab, startTest } from "../helpers";
import { getGraphicsPixelColor, waitForGraphicsToLoad } from "../helpers/screenshot";
import { seekToTimePercent, setFocusRange } from "../helpers/timeline";
import { delay } from "../helpers/utils";
import test, { Page, expect } from "../testFixture";

test.use({ exampleKey: "paint_at_intervals.html" });

async function seekToTimePercentAndWaitForPaint(page: Page, percent: number) {
  await seekToTimePercent(page, percent);
  await waitForGraphicsToLoad(page);
}

test("repaint-05: prefers current time if pause creation failed outside of the focus window", async ({
  pageWithMeta: { page, recordingId },
}) => {
  await startTest(page, recordingId);
  await openDevToolsTab(page);

  await setFocusRange(page, {
    endTimeString: "0:05", // Intentionally past the end of the recording
    startTimeString: "0:03",
  });

  const finalColor = await getGraphicsPixelColor(page, 0, 0);

  let previousColor;

  const percents = [10, 40, 60];
  for (let index = 0; index < percents.length; index++) {
    const percent = percents[index];
    await seekToTimePercentAndWaitForPaint(page, percent);
    await delay(100);
    const newColor = await getGraphicsPixelColor(page, 0, 0);
    await expect(newColor).not.toBe(finalColor);
    await expect(newColor).not.toBe(previousColor);

    previousColor = newColor;
  }
});
