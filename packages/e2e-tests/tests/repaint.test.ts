import { openDevToolsTab, startTest } from "../helpers";
import { rewindToLine, stepOver, waitForPaused } from "../helpers/pause-information-panel";
import { addBreakpoint } from "../helpers/source-panel";
import { waitFor } from "../helpers/utils";
import { Page, test } from "../testFixtureCloneRecording";

test.use({ exampleKey: "doc_control_flow.html" });

test("repaint: repaints the screen screen when stepping over code that modifies the DOM", async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openDevToolsTab(page);

  await addBreakpoint(page, { lineNumber: 50, url: exampleKey });
  await rewindToLine(page, 50);

  const prevSource = await getScreenShotSource(page);

  // this steps over a (synchronous) DOM update. The recorded screenshot for the point after the step
  // will not have changed (because the browser doesn't repaint in the middle of javascript execution),
  // but the repainted screenshot must have changed.
  await stepOver(page);
  await waitForPaused(page);

  await waitFor(async () => {
    const nextSource = await getScreenShotSource(page);
    if (prevSource === nextSource) {
      throw `The screenshot did not change`;
    }
  });
});

async function getScreenShotSource(page: Page): Promise<string> {
  const dataUrl = await page.evaluate(() => {
    const element = document.querySelector("#graphics") as HTMLImageElement;
    return element.src;
  });
  return dataUrl;
}
