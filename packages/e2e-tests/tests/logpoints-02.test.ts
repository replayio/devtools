import { expect } from "@playwright/test";

import { openDevToolsTab, startTest, test } from "../helpers";
import { findConsoleMessage } from "../helpers/console-panel";
import { addLogpoint } from "../helpers/source-panel";

const url = "doc_rr_basic.html";

test(`conditional log-points`, async ({ screen }) => {
  await startTest(screen, url);
  await openDevToolsTab(screen);

  await addLogpoint(screen, {
    condition: `number % 2 == 0`,
    content: '"Logpoint Number " + number',
    lineNumber: 20,
    url,
  });

  await addLogpoint(screen, {
    content: '"Logpoint Beginning"',
    lineNumber: 9,
    url,
  });

  await addLogpoint(screen, {
    content: '"Logpoint Ending"',
    lineNumber: 7,
    url,
  });

  const logPointMessages = await findConsoleMessage(screen, "Logpoint", "log-point");
  await expect(logPointMessages).toHaveCount(7); // 5 logs in the loop + beginning and end
  await expect(logPointMessages.first()).toHaveText(/Beginning/);
  await expect(logPointMessages.last()).toHaveText(/Ending/);
});
