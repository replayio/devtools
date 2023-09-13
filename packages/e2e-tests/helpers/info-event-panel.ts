import { Locator, Page, expect } from "@playwright/test";

import { getByTestName, waitFor } from "./utils";

export function getEventsPanel(page: Page) {
  return getByTestName(page, "EventsList");
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
