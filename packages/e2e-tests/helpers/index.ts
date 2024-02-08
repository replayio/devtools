import { Page, expect } from "@playwright/test";
import chalk from "chalk";
import dotenv from "dotenv";

import { RecordingTarget } from "replay-next/src/suspense/BuildIdCache";

import exampleRecordings from "../examples.json";
import {
  debugPrint,
  getCommandKey,
  getElementClasses,
  waitFor,
  waitForRecordingToFinishIndexing,
} from "./utils";

dotenv.config({ path: "../../.env" });

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
    const isAlreadyActive = await isDevToolsTabActive(page);
    if (isAlreadyActive) {
      return;
    }
    await tab.click();
    await waitFor(async () => {
      const isActive = await isDevToolsTabActive(page);
      expect(isActive).toBe(true);
    });
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
  await waitFor(async () => {
    const isActive = await isViewerTabActive(page);
    expect(isActive).toBe(true);
  });
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

export async function startLibraryTest(
  page: Page,
  apiKey: string,
  teamId: string,
  runId?: string,
  testId?: string
) {
  const base = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:8080";

  const url = `${base}/team/${teamId}/runs${runId ? `/${runId}` : ""}${
    testId ? `/tests/${testId}` : ""
  }?e2e=1&apiKey=${apiKey}`;

  await debugPrint(page, `Navigating to ${chalk.bold(url)}`, "startLibraryTest");

  await page.goto(url);

  await page.locator('[data-test-id="TestRunList"]').waitFor();
  if (runId) {
    await page.waitForSelector('[data-test-id="NoTestRunSelected"]', { state: "detached" });
  }
  if (testId) {
    await page.waitForSelector('[data-test-id="NoTestSelected"]', { state: "detached" });
  }
}

export async function commandPalette(page: Page, query: string) {
  await page.keyboard.press(`${getCommandKey()}+K`);
  await page.keyboard.type(query);
  await page.keyboard.press("Enter");
}

// Intersection (rather than Union) of JSON attributes
type GetKeys<U> = U extends Record<infer K, any> ? K : never;
type UnionToIntersection<U extends object> = {
  [K in GetKeys<U>]: U extends Record<K, infer T> ? T : never;
};

export type TestRecordingKey = keyof typeof exampleRecordings;
export type TestRecordingUnionValue = (typeof exampleRecordings)[TestRecordingKey];
export type TestRecordingIntersectionValue = UnionToIntersection<
  (typeof exampleRecordings)[TestRecordingKey]
>;
export type ExamplesData = Record<TestRecordingKey, TestRecordingUnionValue>;

export interface AuthInfo {
  apiKey: string;
  testScope: string;
}

export async function startTest(
  page: Page,
  recordingId: string,
  auth?: AuthInfo,
  additionalQueryParams?: URLSearchParams,
  shouldWaitForIndexing: boolean = true
) {
  const base = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:8080";

  const params = new URLSearchParams();
  params.append("e2e", "1");
  if (auth) {
    params.append("apiKey", auth.apiKey);
    params.append("testScope", auth.testScope);
  }

  if (additionalQueryParams) {
    for (const [key, value] of additionalQueryParams) {
      params.append(key, value);
    }
  }

  let url = `${base}/recording/${recordingId}?${params.toString()}`;

  await debugPrint(page, `Navigating to ${chalk.bold(url)}`, "startTest");

  await page.goto(url);

  if (shouldWaitForIndexing) {
    // Wait until the backend has finished loading and indexing a recording
    // This reduces the likelihood of unexpectedly slow API calls,
    // which might otherwise cause the test to fail in misleading ways
    await waitForRecordingToFinishIndexing(page);
  }
}
