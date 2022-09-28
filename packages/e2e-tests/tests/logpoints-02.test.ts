import { expect } from "@playwright/test";

import { addLogpoint, clickDevTools, getConsoleMessage, openExample, test } from "../helpers";

const url = "doc_rr_basic.html";

test(`conditional log-points`, async ({ screen }) => {
  await openExample(screen, url);
  await clickDevTools(screen);

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

  const logPointMessages = await getConsoleMessage(screen, "Logpoint", "log-point");
  await expect(logPointMessages).toHaveCount(7); // 5 logs in the loop + beginning and end
  await expect(logPointMessages.first()).toHaveText(/Beginning/);
  await expect(logPointMessages.last()).toHaveText(/Ending/);
});
