import { Page } from "@playwright/test";
import chalk from "chalk";

import { RecordingTarget } from "protocol/thread/thread";

import { debugPrint } from "./utils";

const exampleRecordings = require("../examples.json");

export async function getRecordingTarget(page: Page): Promise<RecordingTarget> {
  return page.evaluate(async () => {
    // @ts-ignore
    const app = window.app as any;
    const target = await app.threadFront.getRecordingTarget();
    return target;
  });
}

export async function openDevToolsTab(page: Page) {
  const tab = page.locator('[data-test-id="ViewToggle-DevTools"]');

  // The DevTools tab won't exist if it's a Node recording
  if (await tab.isVisible()) {
    await tab.click();
  }
}

export async function openViewerTab(page: Page) {
  return page.locator('[data-test-id="ViewToggle-Viewer"]').click();
}

export async function startTest(page: Page, example: string) {
  const recordingId = exampleRecordings[example];
  const base = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:8080";
  const url = `${base}/recording/${recordingId}?e2e=1`;

  await debugPrint(page, `Navigating to ${chalk.bold(url)}`, "startTest");

  await page.goto(url);

  // Wait for the recording basic information to load such that the primary tabs are visible.
  if (!example.startsWith("node")) {
    // Node recordings don't have the "Viewer/DevTools" toggle
    await page.locator('[data-test-id="ViewToggle-Viewer"]').waitFor();
    await page.locator('[data-test-id="ViewToggle-DevTools"]').waitFor();
  }
}
