import { Locator, Page, expect } from "@playwright/test";

import { ANALYSIS_DATA_TIMEOUT, getByTestName, waitFor } from "./utils";

export function getEventsPanel(page: Page) {
  return getByTestName(page, "EventsList");
}

export function getEventListItems(page: Page) {
  const eventsPanel = getEventsPanel(page);
  const events = getByTestName(eventsPanel, "Event");
  return events;
}

export function getEventJumpButton(locator: Locator) {
  return getByTestName(locator, "JumpToCode");
}

// The button ignores clicks while its label reads "Loading...", and the label
// only renders while the button is hovered.
export async function waitForJumpToCodeLabel(
  jumpButton: Locator,
  expected?: string
): Promise<string> {
  const label = getByTestName(jumpButton, "JumpToCodeButtonLabel");
  let text = "";
  await waitFor(
    async () => {
      await jumpButton.hover();
      text = await label.innerText({ timeout: 5_000 });
      if (expected === undefined) {
        expect(text).not.toBe("Loading...");
      } else {
        expect(text).toBe(expected);
      }
    },
    { timeout: ANALYSIS_DATA_TIMEOUT }
  );
  return text;
}

export async function openEventsPanel(page: Page): Promise<void> {
  const pane = getEventsPanel(page);

  const isVisible = await pane.isVisible();
  if (!isVisible) {
    const button = page.locator('[data-test-name="ToolbarButton-ReplayInfo"]');
    await button.click();

    await waitFor(async () => {
      expect(await pane.isVisible()).toBe(true);
    });
  }
}
