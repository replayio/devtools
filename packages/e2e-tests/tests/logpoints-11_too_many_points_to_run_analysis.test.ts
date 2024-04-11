import { openDevToolsTab, startTest } from "../helpers";
import { quickOpen } from "../helpers/commands";
import {
  addLogpoint,
  getPointPanelLocator,
  scrollUntilLineIsVisible,
  verifyLogPointPanelContent,
  waitForSourceLineHitCounts,
} from "../helpers/source-panel";
import { getFocusBeginTime, getFocusEndTime, setFocusRange } from "../helpers/timeline";
import test, { expect } from "../testFixture";

// We need 500...10k hits
// Line 248 has 847 hits
const sourceUrl = "react-dom.production.js";
const lineNumber = 248;

// trunk-ignore(gitleaks/generic-api-key)
test.use({ exampleKey: "breakpoints-01" });

test(`logpoints-11: too-many-points-to-run-analysis UX`, async ({
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
