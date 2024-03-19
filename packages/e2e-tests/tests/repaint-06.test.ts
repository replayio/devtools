import { openDevToolsTab, startTest } from "../helpers";
import { findConsoleMessage, seekToConsoleMessage } from "../helpers/console-panel";
import { stepOver } from "../helpers/pause-information-panel";
import { getGraphicsDataUrl, waitForRepaintGraphicsToLoad } from "../helpers/screenshot";
import { debugPrint } from "../helpers/utils";
import { expect, test } from "../testFixture";

test.use({ exampleKey: "doc_control_flow.html" });

test("repaint-06: repaints the screen screen when stepping over code that modifies the DOM", async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openDevToolsTab(page);

  // TODO [FE-2363] Some of these points fail repaint, so they're disabled until RUN-3397 has been fixed
  const printedStrings = [
    // "catch",
    // "afterCatch",
    "finally",
    // "yield 1",
    "generated 1",
    "yield 2",
    "generated 2",
    "after timer 1",
    "after timer 2",
    "after throw timer 1",
    "after throw timer 2",
    "within iterator",
  ];

  const textToBase64DataMap: {
    [text: string]: string | null;
  } = {};

  {
    await debugPrint(page, "Testing repaint graphics");

    let previousGraphicsDataUrl: string | null = null;

    for (let index = 0; index < printedStrings.length; index++) {
      const string = printedStrings[index];
      const text = `updateText("${string}")`;

      const locator = await findConsoleMessage(page, text, "console-log");
      await seekToConsoleMessage(page, locator);

      // Step from "updateText(...)" to "Element text after..."
      await stepOver(page);
      await stepOver(page);
      await stepOver(page);
      await stepOver(page);

      await waitForRepaintGraphicsToLoad(page);

      const graphicsDataUrl = await getGraphicsDataUrl(page);

      expect(
        graphicsDataUrl,
        `Expected graphics to have been updated to reflect the text "${string}"`
      ).not.toEqual(previousGraphicsDataUrl);

      previousGraphicsDataUrl = graphicsDataUrl;
      textToBase64DataMap[string] = graphicsDataUrl;
    }
  }

  {
    await debugPrint(page, "Testing screenshot caching");

    for (let index = 0; index < printedStrings.length; index++) {
      const string = printedStrings[index];
      const text = `updateText("${string}")`;

      const locator = await findConsoleMessage(page, text, "console-log");
      await seekToConsoleMessage(page, locator);

      // Step from "updateText(...)" to "Element text after..."
      await stepOver(page);
      await stepOver(page);
      await stepOver(page);
      await stepOver(page);

      await waitForRepaintGraphicsToLoad(page);

      const expectedGraphicsDataUrl = textToBase64DataMap[string];
      const actualGraphicsDataUrl = await getGraphicsDataUrl(page);

      expect(
        actualGraphicsDataUrl,
        `Expected graphics for the text "${string}" to match previously cached graphics`
      ).toEqual(expectedGraphicsDataUrl);
    }
  }
});
