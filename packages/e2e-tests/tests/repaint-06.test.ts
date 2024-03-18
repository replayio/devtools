import { openDevToolsTab, startTest } from "../helpers";
import { findConsoleMessage, seekToConsoleMessage } from "../helpers/console-panel";
import { stepOver } from "../helpers/pause-information-panel";
import { getGraphicsDataUrl, waitForRepaintGraphicsToLoad } from "../helpers/screenshot";
import { debugPrint } from "../helpers/utils";
import { expect, test } from "../testFixture";

test.use({ exampleKey: "doc_control_flow.html" });

test.skip("repaint-06: repaints the screen screen when stepping over code that modifies the DOM", async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openDevToolsTab(page);

  const printedStrings = [
    "catch",
    "afterCatch",
    "finally",
    "yield 1",
    "generated 1",
    "yield 2",
    "generated 2",
    "after timer 1",
    "after timer 2",
    "after throw timer 1",
    "after throw timer 2",
    "within iterator",
  ];

  const paints: {
    [key: string]: {
      before: string | null;
      after: string | null;
    };
  } = {};

  {
    await debugPrint(page, "Testing repaint graphics");

    let graphicsDataUrl: string | null = null;
    let previousGraphicsDataUrl: string | null = null;

    for (let index = 0; index < printedStrings.length; index++) {
      const string = printedStrings[index];
      const text = `updateText("${string}")`;

      const locator = await findConsoleMessage(page, text, "console-log");
      await seekToConsoleMessage(page, locator);

      // Step to "Element text before..."
      await stepOver(page);
      await stepOver(page);

      await waitForRepaintGraphicsToLoad(page);

      graphicsDataUrl = await getGraphicsDataUrl(page);
      expect(
        graphicsDataUrl,
        `Expected graphics before "${string}" not to match previous after graphics`
      ).not.toEqual(previousGraphicsDataUrl);
      previousGraphicsDataUrl = graphicsDataUrl;

      const cachedPaints = {
        before: graphicsDataUrl,
        after: "" as string | null,
      };

      // Step to "Element text after..."
      await stepOver(page);
      await stepOver(page);

      await waitForRepaintGraphicsToLoad(page);

      graphicsDataUrl = await getGraphicsDataUrl(page);
      expect(
        graphicsDataUrl,
        `Expected graphics after "${string}" not to match the graphics before`
      ).not.toEqual(previousGraphicsDataUrl);
      previousGraphicsDataUrl = graphicsDataUrl;

      cachedPaints.after = graphicsDataUrl;

      paints[string] = cachedPaints;
    }
  }

  {
    await debugPrint(page, "Testing screenshot caching");

    let graphicsDataUrl: string | null = null;

    for (let index = 0; index < printedStrings.length; index++) {
      const string = printedStrings[index];
      const text = `updateText("${string}")`;

      const locator = await findConsoleMessage(page, text, "console-log");
      await seekToConsoleMessage(page, locator);

      // Step to "Element text before..."
      await stepOver(page);
      await stepOver(page);

      await waitForRepaintGraphicsToLoad(page);

      graphicsDataUrl = await getGraphicsDataUrl(page);
      expect(
        graphicsDataUrl,
        `Expected graphics before "${string}" to match previous cached graphics`
      ).toEqual(paints[string]?.before);

      // Step to "Element text after..."
      await stepOver(page);
      await stepOver(page);

      await waitForRepaintGraphicsToLoad(page);

      graphicsDataUrl = await getGraphicsDataUrl(page);
      expect(
        graphicsDataUrl,
        `Expected graphics after "${string}" to match previous cached graphics`
      ).toEqual(paints[string]?.after);
    }
  }
});
