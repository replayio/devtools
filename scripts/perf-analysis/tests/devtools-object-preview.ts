/* Copyright 2020-2024 Record Replay Inc. */

import type { Page } from "@playwright/test";

const MsPerSecond = 1000;

function waitForTime(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function devtoolsObjectPreview(page: Page) {
  await page.getByRole("button", { name: "Viewer DevTools" }).click();

  await page.locator('[data-test-name="Message"]').hover();
  await waitForTime(MsPerSecond);

  await page.locator('[data-test-id="ConsoleMessageHoverButton"]').click();
  await waitForTime(MsPerSecond);

  await page.locator("div:nth-child(5) > .toolbar-panel-button > button").click();
  await waitForTime(MsPerSecond);

  await page.getByRole("button", { name: "<this>: console{debug: ƒ(...r" }).click();
  await waitForTime(2 * MsPerSecond);
}
