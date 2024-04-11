import { openDevToolsTab, startTest } from "../helpers";
import { getGraphicsPixelColor, waitForGraphicsToLoad } from "../helpers/screenshot";
import { seekToTimePercent, setFocusRange } from "../helpers/timeline";
import test, { Page, expect } from "../testFixture";

test.use({ exampleKey: "paint_at_intervals.html" });

async function seekToTimePercentAndWaitForPaint(page: Page, percent: number) {
  await seekToTimePercent(page, percent);
  await waitForGraphicsToLoad(page);
}

test("repaint-05: prefers current time if pause creation failed outside of the focus window", async ({
  pageWithMeta: { page, recordingId, testScope },
}) => {
  await startTest(page, recordingId, testScope);
  await openDevToolsTab(page);

  await setFocusRange(page, {
    endTimeString: "0:05", // Intentionally past the end of the recording
    startTimeString: "0:03",
  });

  const color = await getGraphicsPixelColor(page, 0, 0);

  for (let index = 0; index < 1; index += 0.25) {
    await seekToTimePercentAndWaitForPaint(page, index);
    const newColor = await getGraphicsPixelColor(page, 0, 0);
    await expect(newColor).not.toBe(color);
  }
});
