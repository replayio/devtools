import { openDevToolsTab, startTest } from "../helpers";
import { warpToMessage } from "../helpers/console-panel";
import { getGraphicsPixelColor, waitForGraphicsToLoad } from "../helpers/screenshot";
import test, { Page, expect } from "../testFixtureCloneRecording";

test.use({ exampleKey: "paint_at_intervals.html" });

async function warpToMessageAndWaitForPaint(page: Page, message: string) {
  await warpToMessage(page, message);
  await waitForGraphicsToLoad(page);
}

test("repaint-04: prefers nearest (<=) paint when seeking between paints", async ({
  pageWithMeta: { page, recordingId },
}) => {
  await startTest(page, recordingId);
  await openDevToolsTab(page);

  let currentColor: string | null = null;
  let mostRecentColor: string | null = null;

  {
    // Before the first paint should be empty
    await warpToMessageAndWaitForPaint(page, "Before first paint");

    const color = await getGraphicsPixelColor(page, 0, 0);
    expect(color).toBe(null);
  }

  {
    // Initial paint should be an empty page
    await warpToMessageAndWaitForPaint(page, "Mount");

    const color = await getGraphicsPixelColor(page, 0, 0);
    expect(color).not.toBe(null);

    mostRecentColor = color;
  }

  for (let paint = 1; paint <= 3; paint++) {
    await warpToMessageAndWaitForPaint(page, `painting ${paint}`);
    currentColor = await getGraphicsPixelColor(page, 0, 0);
    expect(currentColor).toBe(mostRecentColor);

    await warpToMessageAndWaitForPaint(page, `painted ${paint}`);
    currentColor = await getGraphicsPixelColor(page, 0, 0);
    expect(currentColor).not.toBe(mostRecentColor);

    mostRecentColor = currentColor;
  }

  {
    // After last paint should be the same as the last paint
    await warpToMessageAndWaitForPaint(page, "ExampleFinished");

    expect(await getGraphicsPixelColor(page, 0, 0)).toBe(mostRecentColor);
  }
});
