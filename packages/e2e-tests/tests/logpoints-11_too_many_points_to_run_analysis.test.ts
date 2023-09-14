import { openDevToolsTab, startTest } from "../helpers";
import { quickOpen } from "../helpers/commands";
import {
  addLogpoint,
  getPointPanelLocator,
  verifyLogPointPanelContent,
  waitForSourceLineHitCounts,
} from "../helpers/source-panel";
import {
  getFocusBeginTime,
  getFocusEndTime,
  setFocusRange,
  setFocusRangeEndTime,
} from "../helpers/timeline";
import test, { expect } from "../testFixtureCloneRecording";

// We need 500...10k hits
// Line 44 has 4.9k hits
const sourceUrl = "react-dom.production.min.js";
const lineNumber = 44;

// trunk-ignore(gitleaks/generic-api-key)
test.use({ exampleKey: "breakpoints-01" });

test(`logpoints-11: too-many-points-to-run-analysis UX`, async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openDevToolsTab(page);

  await quickOpen(page, "react-dom.production.min.js");

  await waitForSourceLineHitCounts(page, lineNumber);
  await addLogpoint(page, {
    lineNumber,
    saveAfterEdit: false,
    url: sourceUrl,
  });
  await verifyLogPointPanelContent(page, {
    errorMessage: "Too many hits. Focus at start or focus on end.",
    lineNumber,
  });

  const endTime = await getFocusEndTime(page);

  const logPointPanelLocator = getPointPanelLocator(page, lineNumber);
  const startLink = logPointPanelLocator.locator(
    '[data-test-name="LogPointPanel-FocusOnStartLink"]'
  );
  await startLink.click();
  await verifyLogPointPanelContent(page, {
    hitPointsBadge: "500/500",
    lineNumber,
  });
  await expect(await getFocusEndTime(page)).not.toBe(endTime);

  await setFocusRange(page, { endTimeString: "1000" });
  await verifyLogPointPanelContent(page, {
    errorMessage: "Too many hits. Focus at start or focus on end.",
    lineNumber,
  });

  const endLink = logPointPanelLocator.locator('[data-test-name="LogPointPanel-FocusOnEndLink"]');
  await endLink.click();
  await verifyLogPointPanelContent(page, {
    hitPointsBadge: "500/500",
    lineNumber,
  });
  await expect(await getFocusBeginTime(page)).not.toBe(0);
});
