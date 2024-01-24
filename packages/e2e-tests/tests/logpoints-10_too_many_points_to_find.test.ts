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
import test from "../testFixtureCloneRecording";

// We need > 10k hits
const sourceUrl = "react-dom.production.js";
const lineNumber = 149;

// trunk-ignore(gitleaks/generic-api-key)
test.use({ exampleKey: "breakpoints-01" });

test(`logpoints-10: too-many-points-to-find UX`, async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
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
