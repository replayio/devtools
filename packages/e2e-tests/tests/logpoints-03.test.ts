import test, { expect } from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import { addEventListenerLogpoints, findConsoleMessage } from "../helpers/console-panel";

const url = "doc_events.html";

test(`logpoints-03: should display event properties in the console`, async ({ page }) => {
  await startTest(page, url);
  await openDevToolsTab(page);

  await addEventListenerLogpoints(page, [{ eventType: "event.mouse.click", categoryKey: "mouse" }]);

  const message = await findConsoleMessage(page, "MouseEvent", "event");

  await expect(message).toContainText('type: "click"');
  await expect(message).toContainText("target: <div");
  await expect(message).toContainText("clientX: 0");
  await expect(message).toContainText("clientY: 0");
});
