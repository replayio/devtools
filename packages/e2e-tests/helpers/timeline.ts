import { Locator, Page } from "@playwright/test";
import chalk from "chalk";

import { debugPrint } from "./utils";

export async function clearFocusRange(page: Page): Promise<void> {
  await debugPrint(page, `Clearing focus range`, "clearFocusRange");

  await enterFocusMode(page);
  await setFocusRangeStartTime(page, "");
  await setFocusRangeEndTime(page, "99:99");
  await saveFocusRange(page);
}

async function clearTimeInput(page: Page, input: Locator): Promise<void> {
  while (true) {
    const value = await input.inputValue();
    if (value !== "0") {
      await page.keyboard.press("Backspace");
    } else {
      return;
    }
  }
}

export async function enterFocusMode(page: Page): Promise<void> {
  await debugPrint(page, "Entering focus range", "enterFocusMode");

  const button = page.locator('[data-test-id="EditFocusButton"]');
  const state = await button.getAttribute("data-test-state");
  if (state === "off") {
    await button.click();
  }
}

export async function exitFocusMode(page: Page): Promise<void> {
  await debugPrint(page, "Exiting focus range", "exitFocusMode");

  const button = page.locator('[data-test-id="EditFocusButton"]');
  const state = await button.getAttribute("data-test-state");
  if (state === "on") {
    await button.click();
  }
}

export async function saveFocusRange(page: Page): Promise<void> {
  await debugPrint(page, "Saving focus range", "setFocusRange");

  await page.locator('[data-test-id="SaveFocusModeButton"]').click();
}

export async function setFocusRange(
  page: Page,
  options: { endTimeString: string; startTimeString: string }
): Promise<void> {
  const { endTimeString, startTimeString } = options;

  await debugPrint(
    page,
    `Setting focus to ${chalk.bold(`${startTimeString}`)}–${chalk.bold(`${endTimeString}`)}`,
    "setFocusRange"
  );

  await enterFocusMode(page);
  await setFocusRangeStartTime(page, startTimeString);
  await setFocusRangeEndTime(page, endTimeString);
  await saveFocusRange(page);
}

export async function setFocusRangeEndTime(page: Page, timeString: string): Promise<void> {
  await debugPrint(
    page,
    `Setting focus start time to ${chalk.bold(`${timeString}`)}`,
    "setFocusRangeEndTime"
  );

  const input = page.locator('[data-test-id="FocusEndTimeInput"]');
  await input.focus();
  await clearTimeInput(page, input);
  await input.fill(timeString);
}

export async function setFocusRangeStartTime(page: Page, timeString: string): Promise<void> {
  await debugPrint(
    page,
    `Setting focus end time to ${chalk.bold(`${timeString}`)}`,
    "setFocusRangeStartTime"
  );

  const input = page.locator('[data-test-id="FocusStartTimeInput"]');
  await input.focus();
  await clearTimeInput(page, input);
  await input.fill(timeString);
}

export async function seekToPreviousScreenshot(page: Page) {
  const timeline = page.locator(".progress-bar");
  await timeline.press("ArrowLeft");
}
