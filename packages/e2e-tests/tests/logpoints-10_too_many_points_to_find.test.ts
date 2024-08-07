import { openDevToolsTab, startTest } from "../helpers";
import { quickOpen } from "../helpers/commands";
import {
  addLogpoint,
  getPointPanelLocator,
  scrollUntilLineIsVisible,
  verifyLogPointPanelContent,
  waitForSourceLineHitCounts,
} from "../helpers/source-panel";
import { verifyFocusModeVisible } from "../helpers/timeline";
import test from "../testFixture";

// We need > 10k hits
// Line 150 has >20k hits
const sourceUrl = "react-dom.production.js";
const lineNumber = 150;

test.use({ exampleKey: "logpoints-01" });

test(`logpoints-10: too-many-points-to-find UX`, async ({
  pageWithMeta: { page, recordingId, testScope },
  exampleKey,
}) => {
  await startTest(page, recordingId, testScope);
  await openDevToolsTab(page);

  await quickOpen(page, sourceUrl);

  await scrollUntilLineIsVisible(page, lineNumber);
  await waitForSourceLineHitCounts(page, lineNumber);
  await addLogpoint(page, {
    lineNumber,
    saveAfterEdit: false,
    url: sourceUrl,
  });

  await verifyLogPointPanelContent(page, {
    errorMessage: "Use Focus Mode to reduce the number of hits.",
    lineNumber,
  });

  const logPointPanelLocator = getPointPanelLocator(page, lineNumber);
  const link = logPointPanelLocator.locator('[data-test-name="LogPointPanel-FocusModeLink"]');
  await link.click();

  await verifyFocusModeVisible(page);
});
