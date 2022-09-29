import { expect } from "@playwright/test";

import { openDevToolsTab, startTest, test } from "../helpers";
import { addEventListenerLogpoints, findConsoleMessage } from "../helpers/console-panel";

const url = "doc_events.html";

test(`should display event properties in the console`, async ({ screen }) => {
  await startTest(screen, url);
  await openDevToolsTab(screen);

  await addEventListenerLogpoints(screen, ["event.mouse.click"]);

  const message = await findConsoleMessage(screen, "MouseEvent", "event");

  await expect(message).toContainText('type: "click"');
  await expect(message).toContainText("target: <div");
  await expect(message).toContainText("clientX: 0");
  await expect(message).toContainText("clientY: 0");
});
