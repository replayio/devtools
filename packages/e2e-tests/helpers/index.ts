import { Page } from "@playwright/test";
import chalk from "chalk";
import dotenv from "dotenv";

import { RecordingTarget } from "replay-next/src/suspense/BuildIdCache";

import { debugPrint } from "./utils";

dotenv.config({ path: "../../.env" });

const exampleRecordings = require("../examples.json");

export async function getRecordingTarget(page: Page): Promise<RecordingTarget> {
  return page.evaluate(async () => {
    return (window as any).app.store.getState().app.recordingTarget;
  });
}

export async function openDevToolsTab(page: Page) {
  // Wait for the page to load enough that it's safe to continue.
  const header = page.locator('[data-test-name="Header"]');
  await header.waitFor();

  // The DevTools tab won't exist if it's a Node recording.
  const tab = page.locator('[data-test-id="ViewToggle-DevTools"]');
  if (await tab.isVisible()) {
    await tab.click();
  }
}

export async function openViewerTab(page: Page) {
  // Wait for the page to load enough that it's safe to continue.
  const header = page.locator('[data-test-name="Header"]');
  await header.waitFor();

  const tab = page.locator('[data-test-id="ViewToggle-Viewer"]');
  await tab.click();
}

export async function startTest(page: Page, example: string, apiKey?: string) {
  const recordingId = exampleRecordings[example];
  const base = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:8080";

  let url = `${base}/recording/${recordingId}?e2e=1`;
  if (apiKey) {
    url += `&apiKey=${apiKey}`;
  }

  await debugPrint(page, `Navigating to ${chalk.bold(url)}`, "startTest");

  await page.goto(url);

  // Wait for the recording basic information to load such that the primary tabs are visible.
  if (example.startsWith("node")) {
    await page.locator('[data-panel-id="Panel-SecondaryToolbox"]').waitFor();
  } else {
    // Node recordings don't have the "Viewer/DevTools" toggle
    await page.locator('[data-test-id="ViewToggle-Viewer"]').waitFor();
    await page.locator('[data-test-id="ViewToggle-DevTools"]').waitFor();
  }
  await page.locator('[data-panel-id="Panel-SidePanel"]').waitFor();
}
