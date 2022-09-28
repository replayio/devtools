import { expect } from "@playwright/test";

import {
  addEventListenerLogpoints,
  clickDevTools,
  getConsoleMessage,
  openExample,
  test,
} from "../helpers";

const url = "doc_events.html";

test(`should display event properties in the console`, async ({ screen }) => {
  await openExample(screen, url);
  await clickDevTools(screen);

  await addEventListenerLogpoints(screen, ["event.mouse.click"]);

  const message = await getConsoleMessage(screen, "MouseEvent", "event");

  await expect(message).toContainText('type: "click"');
  await expect(message).toContainText("target: <div");
  await expect(message).toContainText("clientX: 0");
  await expect(message).toContainText("clientY: 0");
});
