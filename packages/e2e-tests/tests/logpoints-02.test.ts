import test, { expect } from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import { findConsoleMessage } from "../helpers/console-panel";
import { addLogpoint } from "../helpers/source-panel";

const url = "doc_rr_basic.html";

test(`conditional log-points`, async ({ page }) => {
  await startTest(page, url);
  await openDevToolsTab(page);

  await addLogpoint(page, {
    condition: `number % 2 == 0`,
    content: '"Logpoint Number " + number',
    lineNumber: 20,
    url,
  });

  await addLogpoint(page, {
    content: '"Logpoint Beginning"',
    lineNumber: 9,
    url,
  });

  await addLogpoint(page, {
    content: '"Logpoint Ending"',
    lineNumber: 7,
    url,
  });

  const logPointMessages = await findConsoleMessage(page, "Logpoint", "log-point");
  await expect(logPointMessages).toHaveCount(7); // 5 logs in the loop + beginning and end
  await expect(logPointMessages.first()).toHaveText(/Beginning/);
  await expect(logPointMessages.last()).toHaveText(/Ending/);
});
