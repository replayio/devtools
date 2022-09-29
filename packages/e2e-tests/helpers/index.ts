import { Page } from "@playwright/test";
import chalk from "chalk";

import { debugPrint } from "./utils";

const exampleRecordings = require("../examples.json");

export async function openDevToolsTab(page: Page) {
  return page.locator('[data-test-id="ViewToggle-DevTools"]').click();
}

export async function openViewerTab(page: Page) {
  return page.locator('[data-test-id="ViewToggle-Viewer"]').click();
}

export async function startTest(page: Page, example: string) {
  const recordingId = exampleRecordings[example];
  const base = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:8080";
  const url = `${base}/recording/${recordingId}?e2e=1`;

  debugPrint(`Navigating to ${chalk.bold(url)}`, "startTest");

  await page.goto(url);

  // Wait for the recording basic information to load such that the primary tabs are visible.
  await page.locator('[data-test-id="ViewToggle-Viewer"]').waitFor();
  await page.locator('[data-test-id="ViewToggle-DevTools"]').waitFor();
}

export async function waitFor(callback: () => Promise<void>): Promise<void> {
  // TODO [FE-626]
}
