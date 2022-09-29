import { test as base } from "@playwright/test";
import {
  locatorFixtures as fixtures,
  LocatorFixtures as TestingLibraryFixtures,
} from "@playwright-testing-library/test/fixture";
import chalk from "chalk";

import { debugPrint } from "./utils";
import { Screen } from "./types";

export const test = base.extend<TestingLibraryFixtures>(fixtures);
test.use({
  testIdAttribute: "data-test-id",
});

const exampleRecordings = require("../examples.json");

export async function openDevToolsTab(screen: Screen) {
  return screen.queryByTestId("ViewToggle-DevTools").click();
}

export async function openViewerTab(screen: Screen) {
  return screen.queryByTestId("ViewToggle-Viewer").click();
}

export async function startTest(screen: Screen, example: string) {
  const recordingId = exampleRecordings[example];
  const base = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:8080";
  const url = `${base}/recording/${recordingId}?e2e=1`;

  debugPrint(`Navigating to ${chalk.bold(url)}`, "startTest");

  await screen.goto(url);
}
