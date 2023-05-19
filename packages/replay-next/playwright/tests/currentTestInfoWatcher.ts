import { TestInfo, test } from "@playwright/test";

let currentTestInfo: TestInfo | null = null;

test.afterEach(async () => {
  currentTestInfo = null;
});

test.beforeEach(async ({}, testInfo) => {
  currentTestInfo = testInfo;
});

export function getCurrentTestInfo() {
  return currentTestInfo;
}
