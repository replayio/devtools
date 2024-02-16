import { Locator, Page, expect } from "@playwright/test";
import axios from "axios";
import chalk from "chalk";
import stripAnsi from "strip-ansi";

import config from "../config";

export function getCommandKey() {
  const macOS = process.platform === "darwin";
  return macOS ? "Meta" : "Control";
}

// Playwright doesn't provide a good way to do this (yet).
export async function clearTextArea(page: Page, textArea: Locator) {
  await debugPrint(page, `Clearing content from textarea`, "clearTextArea");

  const selectAllCommand = `${getCommandKey()}+A`;

  await textArea.focus();
  await page.keyboard.press(selectAllCommand);
  await page.keyboard.press("Backspace");
}

// Other test utils can use this to print formatted status messages that help visually monitor test progress.
export async function debugPrint(page: Page | null, message: string, scope?: string) {
  const formattedScope = scope ? `(${scope})` : "";
  console.log("      ", message, formattedScope ? chalk.dim(formattedScope) : "");

  if (page !== null) {
    // Strip out all ANSI escape codes when we log this inside the browser.
    // Otherwise, the console messages in the recording are hard to read.
    const plainMessage = stripAnsi(message);
    await page.evaluate(
      ({ message, scope }) => {
        console.log(`${message} ${scope}`);
      },
      { message: plainMessage, scope: formattedScope }
    );
  }
}

// This helper can be useful when debugging tests but should not be used in committed tests.
// (In other words, don't commit code that relies on this in order to work.)
export function delay(timeout: number) {
  return new Promise(resolve => setTimeout(resolve, timeout));
}

export async function find(
  locatorList: Locator,
  callback: (singleLocator: Locator, index: number) => Promise<boolean>
): Promise<Locator | null> {
  const count = await locatorList.count();
  for (let index = 0; index < count; index++) {
    const singleLocator = locatorList.nth(index);
    const match = await callback(singleLocator, index);
    if (match) {
      return singleLocator;
    }
  }

  return null;
}

export async function forEach(
  locatorList: Locator,
  callback: (singleLocator: Locator, index: number) => Promise<void>
): Promise<void> {
  const count = await locatorList.count();
  for (let index = 0; index < count; index++) {
    const singleLocator = locatorList.nth(index);
    await callback(singleLocator, index);
  }
}

export async function mapLocators<T>(
  locatorList: Locator,
  callback: (singleLocator: Locator, index: number) => Promise<T>
) {
  const count = await locatorList.count();
  return Promise.all(
    Array.from({ length: count }).map((_, i) => {
      return callback(locatorList.nth(i), i);
    })
  );
}

export async function getSupportFormErrorDetails(page: Page) {
  if (await page.locator('[data-test-id="SupportForm"]').isVisible()) {
    let details: string = "";
    try {
      const errorDetailsLocator = page.locator('[data-test-id="UnexpectedErrorDetails"]');
      if (await errorDetailsLocator.isVisible()) {
        details = await errorDetailsLocator.innerText();
      }
    } catch (err) {
      // Ignore locator errors.
      console.error(`ERROR:`, err);
    }
    return details || "(support form is visible)";
  }
  return null;
}

export class UnrecoverableError extends Error {
  constructor(message?: string) {
    super(message);
  }

  get isUnrecoverable() {
    return true;
  }
}

export async function waitForRecordingToFinishIndexing(page: Page): Promise<void> {
  await debugPrint(
    page,
    "Waiting for recording to finish loading",
    "waitForRecordingToFinishIndexing"
  );

  const timelineCapsuleLocator = page.locator('[data-test-id="Timeline-Capsule"]');

  let supportFormErrorDetails: string | null = null;
  await waitFor(
    async () => {
      supportFormErrorDetails = await getSupportFormErrorDetails(page);
      if (supportFormErrorDetails) {
        throw new UnrecoverableError(`Session failed: ${supportFormErrorDetails}`);
      }

      expect(
        await timelineCapsuleLocator.getAttribute("data-test-progress"),
        "Recording did not finish processing"
      ).toBe("100");
    },
    {
      retryInterval: 1_000,
      timeout: 150_000,
    }
  );
}

export async function toggleExpandable(
  page: Page,
  options: {
    scope?: Locator;
    targetState?: "open" | "closed";
    text?: string;
  }
): Promise<void> {
  const { scope = page, targetState = "open", text } = options;

  const label = text ? `expandable with text "${chalk.bold(text)}"` : "expandable";

  const expander = text
    ? scope.locator(`[data-test-name="Expandable"]:has-text("${text}")`).first()
    : scope.locator(`[data-test-name="Expandable"]`).first();
  const currentState = await expander.getAttribute("data-test-state");
  if (currentState !== targetState) {
    await debugPrint(
      page,
      `${targetState === "open" ? "Opening" : "Closing"} ${label}`,
      "toggleExpandable"
    );

    await expander.click();
  } else {
    await debugPrint(page, `The ${label} is already ${targetState}`, "toggleExpandable");
  }
}

export async function waitFor(
  callback: () => Promise<void>,
  options: {
    retryInterval?: number;
    timeout?: number;
  } = {}
): Promise<void> {
  const { retryInterval = 250, timeout = 5_000 } = options;

  const startTime = performance.now();

  const consoleLog = console.log;
  const messages: any[] = [];
  console.log = (...rest) => messages.push(rest);

  try {
    while (true) {
      // This loop tries failing code many times before giving up.
      // It's noisy to log expect() failures on every attempt,
      // so we suppress them for all but the last attempt.
      messages.length = 0;

      try {
        await callback();
        return;
      } catch (error: any) {
        if (error?.message?.includes("crash") ||
            error?.isUnrecoverable) 
        {
          // We have to resort to heuristics since:
          // 1. We don't have access to the `Page` object, and
          // 2. the Error object also has no special properties.
          throw error;
        }
        
        if (performance.now() - startTime > timeout) {
          messages.forEach(args => consoleLog(...args));
          throw error;
        }   
        
        if (!error?.matcherResult) {
          // Not an `expect` error: → Log it.
          console.log("ERROR:", error?.stack || error);
        }
      }
      await delay(retryInterval);
    }
  } finally {
    console.log = consoleLog;
  }
}

export const getElementClasses = (loc: Locator) => loc.evaluate(el => Array.from(el.classList));

export const getByTestName = (parent: Page | Locator, testName: string) => {
  // Sometimes there's a space, sometimes not
  return parent.locator(`[data-test-name="${testName}"]`);
};

export const getByTestNameNoSpace = (parent: Page | Locator, testName: string) => {
  // Sometimes there's a space, sometimes not
  return parent.locator(`[data-testname="${testName}"]`);
};

export async function locatorTextToNumber(locator: Locator): Promise<number | null> {
  const isVisible = await locator.isVisible();
  if (!isVisible) {
    return null;
  }
  const text = await locator.textContent();
  const trimmed = text?.trim();
  return trimmed ? parseInt(trimmed) : null;
}

export async function resetTestUser(email: string, testScope: string) {
  const variables = { email, secret: process.env.AUTOMATED_TEST_SECRET };

  return axios({
    url: config.graphqlUrl,
    method: "POST",
    headers: { "replay-test-scope": testScope },
    data: {
      query: `
        mutation resetTestUser($email: String!, $secret: String!) {
          resetTestUser(input: { email: $email, secret: $secret }) {
            success
          }
        }
      `,
      variables,
    },
  });
}

export async function cloneTestRecording(recordingId: string): Promise<string> {
  if (!process.env.AUTHENTICATED_TESTS_WORKSPACE_API_KEY) {
    throw new Error(
      "AUTHENTICATED_TESTS_WORKSPACE_API_KEY must be set in order to clone test recordings."
    );
  }

  const variables = { recordingId, secret: process.env.AUTOMATED_TEST_SECRET };

  var startTime = performance.now();
  const clonedRecording = await axios({
    url: config.graphqlUrl,
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.AUTHENTICATED_TESTS_WORKSPACE_API_KEY}`,
    },
    data: {
      query: `
        mutation cloneTestRecording($recordingId: UUID!, $secret: String!) {
          cloneTestRecording(input: { recordingId: $recordingId, secret: $secret }) {
            recordingId
          }
        }
      `,
      variables,
    },
  });
  var endTime = performance.now();
  const timeInSecs = Math.round((endTime - startTime) / 1000);
  if (timeInSecs > 10) {
    console.warn(`Cloning took ${timeInSecs} seconds.`);
  }

  return clonedRecording.data.data.cloneTestRecording.recordingId;
}

export async function deleteTestRecording(recordingId: string) {
  if (!process.env.AUTHENTICATED_TESTS_WORKSPACE_API_KEY) {
    throw new Error(
      "AUTHENTICATED_TESTS_WORKSPACE_API_KEY must be set in order to delete test recordings."
    );
  }

  const variables = { recordingId, secret: process.env.AUTOMATED_TEST_SECRET };

  return axios({
    url: config.graphqlUrl,
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.AUTHENTICATED_TESTS_WORKSPACE_API_KEY}`,
    },
    data: {
      query: `
          mutation deleteTestRecording($recordingId: UUID!, $secret: String!) {
            deleteTestRecording(input: { recordingId: $recordingId, secret: $secret }) {
              success
            }
          }
        `,
      variables,
    },
  });
}
