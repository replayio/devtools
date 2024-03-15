import { openDevToolsTab, startTest } from "../helpers";
import { rewindToLine, stepOver, waitForPaused } from "../helpers/pause-information-panel";
import { getGraphicsDataUrl } from "../helpers/screenshot";
import { addBreakpoint } from "../helpers/source-panel";
import { waitFor } from "../helpers/utils";
import { Page, test } from "../testFixture";
import { warpToMessage } from "../helpers/console-panel";
import { getGraphicsPixelColor, waitForGraphicsToLoad } from "../helpers/screenshot";
test.use({ exampleKey: "doc_control_flow.html" });

test("repaint-01: repaints the screen screen when stepping over code that modifies the DOM", async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openDevToolsTab(page);

  // await addBreakpoint(page, { lineNumber: 50, url: exampleKey });
  // await rewindToLine(page, 50);

  // const prevSource = await getGraphicsDataUrl(page);

  // // this steps over a (synchronous) DOM update. The recorded screenshot for the point after the step
  // // will not have changed (because the browser doesn't repaint in the middle of javascript execution),
  // // but the repainted screenshot must have changed.
  // await stepOver(page);
  // await waitForPaused(page);

  // await waitFor(async () => {
  //   const nextSource = await getGraphicsDataUrl(page);
  //   if (prevSource === nextSource) {
  //     throw `The screenshot did not change`;
  //   }
  // });

  await warpToMessageAndWaitForPaint(page, `Element text after: "after timer 2"`);
  await warpToMessageAndWaitForPaint(page, `Element text after: "after timer 1"`);
  await warpToMessageAndWaitForPaint(page, `Element text after: "generated 2"`);
  await warpToMessageAndWaitForPaint(page, `Element text before: "generated 1"`);
});
async function warpToMessageAndWaitForPaint(page: Page, message: string) {
  await warpToMessage(page, message);
  await waitForGraphicsToLoad(page);
}