import { Locator, Page, expect } from "@playwright/test";
import chalk from "chalk";

import { debugPrint, delay, getByTestName, waitFor } from "./utils";

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
  options: { endTimeString?: string; startTimeString?: string }
): Promise<void> {
  const { endTimeString, startTimeString } = options;

  await debugPrint(
    page,
    `Setting focus to ${chalk.bold(`${startTimeString}`)}–${chalk.bold(`${endTimeString}`)}`,
    "setFocusRange"
  );

  await enterFocusMode(page);
  if (startTimeString != null) {
    await setFocusRangeStartTime(page, startTimeString);
  }
  if (endTimeString != null) {
    await setFocusRangeEndTime(page, endTimeString);
  }
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
  await input.blur();
  // TODO [FE-1854] setting the focus window takes some time
  // because we need to fetch execution points first
  await delay(200);
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
  await input.blur();
  // TODO [FE-1854] setting the focus window takes some time
  // because we need to fetch execution points first
  await delay(200);
}

export function getTimeline(page: Page) {
  return page.locator('[data-test-id="Timeline"]');
}

export async function getFocusBeginTime(page: Page) {
  const timelineLocator = getTimeline(page);
  const value = await timelineLocator.getAttribute("data-test-focus-begin-time");
  return value ? parseInt(value) : null;
}

export async function getFocusEndTime(page: Page) {
  const timelineLocator = getTimeline(page);
  const value = await timelineLocator.getAttribute("data-test-focus-end-time");
  return value ? parseInt(value) : null;
}

export function getTimelineProgressBar(page: Page) {
  return page.locator('[data-test-id="Timeline-ProgressBar"]');
}

export async function getTimelineCurrentHoverPercent(page: Page) {
  const timeline = getTimelineProgressBar(page);
  const previewLine = timeline.locator(".progress-line.preview-min");
  // 0..100, not 0..1
  const previewLinePercent = Number(await previewLine.getAttribute("data-hover-value"));
  return previewLinePercent;
}

export async function getTimelineCurrentPercent(page: Page) {
  const progressLine = getByTestName(page, "current-progress");
  // 0..100, not 0..1
  const percent = Number(await progressLine.getAttribute("data-current-progress-value"));
  return percent;
}

export async function seekToTimePercent(page: Page, timePercent: number) {
  await debugPrint(page, `Seeking timeline to ${timePercent}%`, "seekToTimePercent");

  const timeline = getTimelineProgressBar(page);
  const timelineBoundingBox = await timeline.boundingBox();
  expect(timelineBoundingBox).not.toBeFalsy();

  const width = timelineBoundingBox!.width;
  const x = Math.min(width * (timePercent / 100), width - 1);
  const y = timelineBoundingBox!.height / 2;
  await timeline.click({
    position: { x, y },
  });
}

export async function waitForTimelineAdvanced(page: Page, prevPercent: number) {
  let currentPercent = 0;
  await waitFor(async () => {
    currentPercent = await getTimelineCurrentPercent(page);

    expect(currentPercent).toBeGreaterThan(0);
    expect(currentPercent).toBeGreaterThan(prevPercent);
  });

  return currentPercent;
}

export async function verifyFocusModeVisible(page: Page) {
  await page.waitForSelector('[data-test-id="SaveFocusModeButton"]');
}
