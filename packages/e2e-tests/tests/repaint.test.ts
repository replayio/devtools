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
  await startTest(page, exampleKey, recordingId);
  await openDevToolsTab(page);

  await addBreakpoint(page, { lineNumber: 50, url: exampleKey });
  await rewindToLine(page, 50);

  const prevDataUrl = await getCanvasDataUrl(page);

  await stepOver(page);
  await waitForPaused(page);

  await waitFor(async () => {
    const nextDataUrl = await getCanvasDataUrl(page);
    if (prevDataUrl === nextDataUrl) {
      throw `The screenshot did not change`;
    }
  });
});

async function getCanvasDataUrl(page: Page): Promise<string> {
  const dataUrl = await page.evaluate(() => {
    const canvas = document.querySelector("#graphics") as HTMLCanvasElement;
    return canvas.toDataURL();
  });
  return dataUrl;
}
