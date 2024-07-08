import { openDevToolsTab, startTest } from "../helpers";
import { findConsoleMessage } from "../helpers/console-panel";
import {
  findPoints,
  openPauseInformationPanel,
  togglePoint,
} from "../helpers/pause-information-panel";
import {
  addLogpoint,
  seekToPreviousLogPointHit,
  verifyLogpointStep,
} from "../helpers/source-panel";
import test, { expect } from "../testFixture";

test.use({ exampleKey: "doc_rr_basic.html" });

test(`logpoints-02: conditional log-points`, async ({
  pageWithMeta: { page, recordingId, testScope },
  exampleKey,
}) => {
  await startTest(page, recordingId, testScope);
  await openDevToolsTab(page);

  await addLogpoint(page, {
    condition: `number % 2 == 0`,
    content: '"Logpoint Number " + number',
    lineNumber: 20,
    url: exampleKey,
  });

  await addLogpoint(page, {
    content: '"Logpoint Beginning"',
    lineNumber: 9,
    url: exampleKey,
  });

  await addLogpoint(page, {
    content: '"Logpoint Ending"',
    lineNumber: 7,
    url: exampleKey,
  });

  await openPauseInformationPanel(page);
  const logPointMessages = await findConsoleMessage(page, "Logpoint", "log-point");
  await expect(logPointMessages).toHaveCount(7); // 5 logs in the loop + beginning and end
  await expect(logPointMessages.first()).toHaveText(/Beginning/);
  await expect(logPointMessages.last()).toHaveText(/Ending/);

  const logpoint = findPoints(page, "logpoint", { lineNumber: 20 });
  await togglePoint(page, logpoint, false);
  await expect(logPointMessages).toHaveCount(2);
  await togglePoint(page, logpoint, true);
  await expect(logPointMessages).toHaveCount(7);

  await seekToPreviousLogPointHit(page, 20);
  await verifyLogpointStep(page, "5/5", { lineNumber: 20 });
  await seekToPreviousLogPointHit(page, 20);
  await verifyLogpointStep(page, "4/5", { lineNumber: 20 });
});
