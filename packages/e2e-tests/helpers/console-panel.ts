import { Locator, Page } from "@playwright/test";
import chalk from "chalk";

import { waitForPaused } from "./pause-information-panel";
import { Expected, MessageType } from "./types";
import { debugPrint, find, waitFor } from "./utils";

const categoryNames = {
  keyboard: "Keyboard",
  mouse: "Mouse",
  pointer: "Pointer",
  timer: "Timer",
  websocket: "WebSocket",
};

type CategoryKey = keyof typeof categoryNames;

export async function addEventListenerLogpoints(page: Page, eventTypes: string[]): Promise<void> {
  for (let eventType of eventTypes) {
    const [, categoryKey, eventName] = eventType.split(".");

    debugPrint(
      `Adding event type "${chalk.bold(eventName)}" in category "${chalk.bold(categoryKey)}"`,
      "addEventListenerLogpoints"
    );

    await expandFilterCategory(page, categoryNames[categoryKey as CategoryKey]);
    await page.locator(`[data-test-id="EventTypes-${eventType}"]`).setChecked(true);
  }
}

export async function clearConsoleEvaluations(page: Page): Promise<void> {
  await page.locator('[data-test-id="ClearConsoleEvaluationsButton"]').click();
}

export function getConsoleMessageTypeCheckbox(
  page: Page,
  type: "exceptions" | "logs" | "warnings" | "errors"
) {
  return page.locator(`input#FilterToggle-${type}`);
}

export async function enableConsoleMessageType(
  page: Page,
  type: "exceptions" | "logs" | "warnings" | "errors"
) {
  const checkbox = getConsoleMessageTypeCheckbox(page, type);
  await checkbox.check();
}

export async function focusConsoleTextArea(page: Page) {
  const consoleRoot = page.locator('[data-test-id="ConsoleRoot"]');

  // Wait for the Console to stop loading
  await consoleRoot.locator("text=Unavailable...").waitFor({ state: "hidden" });

  const term = page.locator('[data-test-id="JSTerm"]');

  const textArea = term.locator("textarea");

  await textArea.focus();

  return textArea;
}

export async function executeTerminalExpression(page: Page, text: string): Promise<void> {
  debugPrint(`Executing terminal expression "${chalk.bold(text)}"`, "executeTerminalExpression");

  await openConsolePanel(page);

  const textArea = await focusConsoleTextArea(page);

  await textArea.type(text);
  await textArea.press("Enter");
}

export async function executeAndVerifyTerminalExpression(
  page: Page,
  text: string,
  expected: Expected,
  clearConsoleAfter: boolean = true
): Promise<void> {
  await openConsolePanel(page);
  await executeTerminalExpression(page, text);
  await verifyConsoleMessage(page, expected, "terminal-expression");
  if (clearConsoleAfter) {
    await clearConsoleEvaluations(page);
  }
}

export async function expandConsoleMessage(message: Locator) {
  const expander = message.locator('[data-test-name="Expandable"]');
  const state = await expander.getAttribute("data-test-state");
  if (state === "closed") {
    await expander.click();
  }
}

export async function expandFilterCategory(page: Page, categoryName: string) {
  debugPrint(
    `Expanding Console event filter category "${chalk.bold(categoryName)}"`,
    "expandFilterCategory"
  );

  const consoleFilters = page.locator('[data-test-id="ConsoleFilterToggles"]');

  const categoryLabel = consoleFilters.locator(`[data-test-name="Expandable"]`, {
    hasText: categoryName,
  });

  const state = await categoryLabel.getAttribute("data-test-state");
  if (state === "closed") {
    await categoryLabel.click();
  }
}

export function findConsoleMessage(
  page: Page,
  expected?: Expected,
  messageType?: MessageType
): Locator {
  debugPrint(
    `Searching for console message${
      messageType ? ` of type "${chalk.bold(messageType)}" ` : " "
    }with text "${chalk.bold(expected)}"`,
    "findConsoleMessage"
  );

  const attributeSelector = messageType
    ? `[data-test-message-type="${messageType}"]`
    : '[data-test-name="Message"]';

  return expected
    ? page.locator(`${attributeSelector}:has-text("${expected}")`)
    : page.locator(`${attributeSelector}`);
}

export function getMessageSourceLink(message: Locator): Locator {
  return message.locator(`[data-test-name="Console-Source"]`);
}

export async function getFrameLocationsFromMessage(message: Locator) {
  await expandConsoleMessage(message);
  const frameLocations = message.locator(
    '[data-test-name="Stack"] [data-test-name="Console-Source"]'
  );
  return await frameLocations.allInnerTexts();
}

export async function openConsolePanel(page: Page): Promise<void> {
  await page.locator('[data-test-id="PanelButton-console"]').click();
}

export async function openMessageSource(message: Locator): Promise<void> {
  const sourceLink = getMessageSourceLink(message);
  const textContent = await sourceLink.textContent();

  debugPrint(`Opening message source "${chalk.bold(textContent)}"`, "openMessageSource");

  await sourceLink.click();
}

export async function seekToConsoleMessage(
  page: Page,
  consoleMessage: Locator,
  line?: number
): Promise<void> {
  const textContent = await consoleMessage.locator('[data-test-name="LogContents"]').textContent();

  debugPrint(`Seeking to message "${chalk.bold(textContent)}"`, "seekToConsoleMessage");

  await consoleMessage.scrollIntoViewIfNeeded();
  await consoleMessage.hover();
  await consoleMessage.locator('[data-test-id="ConsoleMessageHoverButton"]').click();

  await waitForPaused(page, line);
}

export async function verifyConsoleMessage(
  page: Page,
  expected: Expected,
  messageType?: MessageType,
  expectedCount?: number
) {
  debugPrint(
    `Verifying the presence of a console message${
      messageType ? ` of type "${chalk.bold(messageType)}" ` : " "
    }with text "${chalk.bold(expected)}"`,
    "verifyConsoleMessage"
  );

  const messages = findConsoleMessage(page, expected, messageType);

  if (expectedCount != null) {
    // Verify a specific number of messages
    await waitFor(async () => {
      const count = await messages.count();
      if (count !== expectedCount) {
        throw `Expected ${expectedCount} messages, but found ${count}`;
      }
    });
  } else {
    // Or just verify that there was at least one
    const message = messages.first();
    await message.waitFor();
  }
}

// This function considers any message with the current pause line above it as satisfying the "paused at" condition.
// It doesn't have to be a literal execution point match.
export async function verifyPausedAtMessage(
  page: Page,
  expected: Expected,
  messageType?: MessageType
): Promise<void> {
  debugPrint(
    `Verifying currently paused at console message${
      messageType ? ` of type "${chalk.bold(messageType)}" ` : " "
    }with text "${chalk.bold(expected)}"`,
    "verifyPausedAtMessage"
  );

  await waitFor(async () => {
    const result = await page.evaluate(
      ({ messageType, text }) => {
        const attributeSelector = messageType
          ? `[data-test-message-type="${messageType}"]`
          : '[data-test-name="Message"]';

        const matchingMessages = Array.from(document.querySelectorAll(attributeSelector)).filter(
          message => message.textContent?.includes(`${text}`)
        );

        return (
          matchingMessages.find(message => {
            if (
              message &&
              message.previousSibling &&
              (message.previousSibling as Element).getAttribute
            ) {
              return (
                (message.previousSibling as Element).getAttribute("data-test-id") ===
                "Console-CurrentTimeIndicator"
              );
            }
          }) != null
        );
      },
      { messageType, text: expected }
    );

    if (!result) {
      throw `Not paused at console message${
        messageType ? ` of type "${messageType}" ` : " "
      }with text "${expected}"`;
    }
  });
}

export async function verifyTrimmedConsoleMessages(
  page: Page,
  options: {
    expectedAfter: number;
    expectedBefore: number;
  }
): Promise<void> {
  const { expectedAfter, expectedBefore } = options;

  const beforeString =
    expectedBefore === 1 ? "1 message" : `${expectedBefore === 0 ? "no" : expectedBefore} messages`;
  const afterString =
    expectedAfter === 1 ? "1 message" : `${expectedAfter === 0 ? "no" : expectedAfter} messages`;

  debugPrint(
    `Verifying console has trimmed ${beforeString} before and ${afterString} after`,
    "verifyTrimmedConsoleMessages"
  );

  await waitFor(async () => {
    const actualBefore = await page
      .locator('[data-test-id="MessagesList-TrimmedBeforeCount"]')
      .textContent();
    const actualAfter = await page
      .locator('[data-test-id="MessagesList-TrimmedAfterCount"]')
      .textContent();

    if (actualBefore !== expectedBefore.toString() || actualAfter !== expectedAfter.toString()) {
      throw `Expected ${expectedBefore} before and ${expectedAfter} after, but found ${actualBefore} before and ${actualAfter} after`;
    }
  });
}

export async function warpToMessage(page: Page, text: string, line?: number) {
  const message = findConsoleMessage(page, text).first();
  await seekToConsoleMessage(page, message, line);
}
