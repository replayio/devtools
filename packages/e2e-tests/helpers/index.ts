import { Page } from "@playwright/test";
import chalk from "chalk";
import dotenv from "dotenv";

import { RecordingTarget } from "replay-next/src/suspense/BuildIdCache";

import { debugPrint, getElementClasses } from "./utils";

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
  const tab = getDevToolsTab(page);
  if (await tab.isVisible()) {
    await tab.click();
  }
}

export const getDevToolsTab = (page: Page) => page.locator('[data-test-id="ViewToggle-DevTools"]');

export const getViewerTab = (page: Page) => page.locator('[data-test-id="ViewToggle-Viewer"]');

export async function openViewerTab(page: Page) {
  // Wait for the page to load enough that it's safe to continue.
  const header = page.locator('[data-test-name="Header"]');
  await header.waitFor();

  const tab = getViewerTab(page);
  await tab.click();
}

export async function isViewerTabActive(page: Page) {
  const tab = getViewerTab(page);
  const classes = await getElementClasses(tab);
  return classes.includes("active");
}

export async function isDevToolsTabActive(page: Page) {
  const tab = getDevToolsTab(page);
  const classes = await getElementClasses(tab);
  return classes.includes("active");
}

export async function openRecording(
  page: Page,
  recordingId: string,
  node?: boolean,
  apiKey?: string
) {
  const base = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:8080";

  let url = `${base}/recording/${recordingId}?e2e=1`;
  if (apiKey) {
    url += `&apiKey=${apiKey}`;
  }

  await debugPrint(page, `Navigating to ${chalk.bold(url)}`, "startTest");

  await page.goto(url);

  // When Replay is under heavy load, the backend may need to scale up AWS resources.
  // This should not cause e2e tests to fail, even though it takes longer than the default 15s timeout.
  // Relaxing only the initial check allows more time for the backend to scale up
  // without compromising the integrity of the tests overall.
  await page.locator('[data-panel-id="Panel-SidePanel"]').waitFor({
    timeout: 60_000,
  });

  // Wait for the recording basic information to load such that the primary tabs are visible.
  if (node) {
    await page.locator('[data-panel-id="Panel-SecondaryToolbox"]').waitFor();
  } else {
    // Node recordings don't have the "Viewer/DevTools" toggle
    await page.locator('[data-test-id="ViewToggle-Viewer"]').waitFor();
    await page.locator('[data-test-id="ViewToggle-DevTools"]').waitFor();
  }
}

export async function startTest(page: Page, example: string, apiKey?: string) {
  const recordingId = exampleRecordings[example];

  openRecording(page, recordingId, example.startsWith("node"), apiKey);
}
