import { Locator, Page, expect } from "@playwright/test";
import chalk from "chalk";

import { Badge } from "shared/client/types";

import { submitCurrentText as submitCurrentTextLexical, type as typeLexical } from "./lexical";
import { waitForPaused } from "./pause-information-panel";
import { Expected, MessageType } from "./types";
import { debugPrint, toggleExpandable, waitFor } from "./utils";

const categoryNames = {
  keyboard: "Keyboard",
  mouse: "Mouse",
  pointer: "Pointer",
  timer: "Timer",
  websocket: "WebSocket",
};

type CategoryKey = keyof typeof categoryNames;

export interface EventListenerEntry {
  eventType: string;
  categoryKey: string;
}

export async function addEventListenerLogpoints(
  page: Page,
  eventEntries: EventListenerEntry[]
): Promise<void> {
  await toggleSideFilters(page, true);

  for (let eventEntry of eventEntries) {
    const { categoryKey, eventType } = eventEntry;

    await debugPrint(
      page,
      `Adding event type "${chalk.bold(eventType)}" in category "${chalk.bold(categoryKey)}"`,
      "addEventListenerLogpoints"
    );

    await expandFilterCategory(page, categoryNames[categoryKey as CategoryKey]);
    await page.locator(`[data-test-id="EventTypes-${eventType}"]`).setChecked(true);
  }
}

export async function clearConsoleEvaluations(page: Page): Promise<void> {
  await page.locator('[data-test-id="ClearConsoleEvaluationsButton"]').click();
  const evaluations = page.locator('[data-test-message-type="terminal-expression"]');
  await waitFor(async () => expect(await evaluations.count()).toBe(0));
}

export function getConsoleMessageTypeCheckbox(
  page: Page,
  type: "exceptions" | "logs" | "warnings" | "errors"
) {
  return page.locator(`input#FilterToggle-${type}`);
}

export async function disableConsoleMessageType(
  page: Page,
  type: "exceptions" | "logs" | "warnings" | "errors"
) {
  await toggleConsoleMessageType(page, type, false);
}

export async function disableAllConsoleMessageTypes(page: Page) {
  await toggleConsoleMessageType(page, "exceptions", false);
  await toggleConsoleMessageType(page, "logs", false);
  await toggleConsoleMessageType(page, "warnings", false);
  await toggleConsoleMessageType(page, "errors", false);
}

export async function enableConsoleMessageType(
  page: Page,
  type: "exceptions" | "logs" | "warnings" | "errors"
) {
  await toggleConsoleMessageType(page, type, true);
}

export async function enableAllConsoleMessageTypes(page: Page) {
  await toggleConsoleMessageType(page, "exceptions", true);
  await toggleConsoleMessageType(page, "logs", true);
  await toggleConsoleMessageType(page, "warnings", true);
  await toggleConsoleMessageType(page, "errors", true);
}

export async function toggleConsoleMessageType(
  page: Page,
  type: "exceptions" | "logs" | "warnings" | "errors",
  enabled: boolean
) {
  await openConsolePanel(page);
  await toggleSideFilters(page, true);

  // Use checkbox.click() rather than checkbox.check()
  // because the latter wil sometimes fail prematurely if the checkbox state doesn't change quickly enough
  // Note this requires us to verify the initial state of the checkbox before clicking
  const checkbox = getConsoleMessageTypeCheckbox(page, type);
  await waitFor(async () => {
    const isChecked = await checkbox.isChecked();
    if (isChecked !== enabled) {
      await checkbox.click();
    }
  });
}

export async function executeTerminalExpression(
  page: Page,
  text: string,
  shouldSubmit: boolean = true
): Promise<void> {
  await debugPrint(
    page,
    `Executing terminal expression "${chalk.bold(text)}"`,
    "executeTerminalExpression"
  );

  await openConsolePanel(page);

  const consoleRoot = page.locator('[data-test-id="ConsoleRoot"]');

  // Wait for the Console to stop loading
  await consoleRoot.locator("text=Unavailable...").waitFor({ state: "hidden" });

  await typeLexical(page, '[data-test-id="ConsoleTerminalInput"]', text, shouldSubmit);
}

export async function executeAndVerifyTerminalExpression(
  page: Page,
  text: string,
  expected: Expected,
  clearConsoleAfter: boolean = true
): Promise<void> {
  await openConsolePanel(page);
  await executeTerminalExpression(page, text);
  await verifyEvaluationResult(page, expected);
  if (clearConsoleAfter) {
    await clearConsoleEvaluations(page);
  }
}

export async function clearTerminalExpressions(page: Page) {
  await page.click("[data-test-id=ClearConsoleEvaluationsButton]");
}

export function getConsoleTerminalContentTypeAhead(page: Page): Locator {
  return page.locator('[data-test-id="ConsoleTerminalInput-CodeTypeAhead"]');
}

export async function verifyConsoleTerminalTypeAheadSuggestions(
  page: Page,
  expectedPartialList: string[]
) {
  const actualTextContent = (await getConsoleTerminalContentTypeAhead(page).textContent()) || "";
  const expectedTextContent = expectedPartialList.join("");
  expect(actualTextContent.startsWith(expectedTextContent)).toBe(true);
}

export async function expandConsoleMessage(message: Locator) {
  const expander = message.locator('[data-test-name="Expandable"]').first();
  const state = await expander.getAttribute("data-test-state");
  if (state === "closed") {
    await expander.click();
  }
}

export async function expandErrorStack(message: Locator) {
  const expander = message.locator('[data-test-name="Expandable"]').last();
  const state = await expander.getAttribute("data-test-state");
  if (state === "closed") {
    await expander.click();
    await message.locator('[data-test-name="ErrorStack"]').waitFor();
  }
}

export async function expandFilterCategory(page: Page, categoryName: string) {
  await debugPrint(
    page,
    `Expanding Console event filter category "${chalk.bold(categoryName)}"`,
    "expandFilterCategory"
  );

  await toggleSideFilters(page, true);

  const consoleFilters = page.locator('[data-test-id="ConsoleFilterToggles"]');

  const categoryLabel = consoleFilters.locator(`[data-test-name="Expandable"]`, {
    hasText: categoryName,
  });

  const state = await categoryLabel.getAttribute("data-test-state");
  if (state === "closed") {
    await categoryLabel.click();
  }
}

export async function findConsoleMessage(
  page: Page,
  expected?: Expected,
  messageType?: MessageType
): Promise<Locator> {
  await debugPrint(
    page,
    `Searching for console message${
      messageType ? ` of type "${chalk.bold(messageType)}" ` : " "
    }with text "${chalk.bold(expected)}"`,
    "findConsoleMessage"
  );

  const attributeSelector = messageType
    ? `[data-test-message-type="${messageType}"]`
    : '[data-test-name="Message"]';

  // Use single quotes because a couple messages have double quoted text displayed
  return expected
    ? page.locator(`${attributeSelector}:has-text('${expected}')`)
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

export async function getErrorFrameLocationsFromMessage(message: Locator) {
  await expandErrorStack(message);
  const frameLocations = message.locator(
    '[data-test-name="ErrorStack"] [data-test-name="Console-Source"]'
  );
  return await frameLocations.allInnerTexts();
}

export async function openConsolePanel(page: Page): Promise<void> {
  await page.locator('[data-test-id="PanelButton-console"]').click();
}

export async function openMessageSource(page: Page, message: Locator): Promise<void> {
  const sourceLink = getMessageSourceLink(message);
  const textContent = await sourceLink.textContent();

  await debugPrint(
    page,
    `Opening message source "${chalk.bold(textContent)}"`,
    "openMessageSource"
  );

  await sourceLink.click();
}

export async function seekToConsoleMessage(
  page: Page,
  consoleMessage: Locator,
  line?: number
): Promise<void> {
  const textContent = await consoleMessage.locator('[data-test-name="LogContents"]').textContent();

  await debugPrint(page, `Seeking to message "${chalk.bold(textContent)}"`, "seekToConsoleMessage");

  await consoleMessage.scrollIntoViewIfNeeded();
  await consoleMessage.waitFor();
  await consoleMessage.hover();
  await consoleMessage.locator('[data-test-id="ConsoleMessageHoverButton"]').click();

  await waitFor(
    async () =>
      await expect(await consoleMessage.getAttribute("data-test-paused-here")).toBe("true")
  );

  await waitForPaused(page, line);
}

export async function submitCurrentText(page: Page) {
  await submitCurrentTextLexical(page, '[data-test-id="ConsoleTerminalInput"]');
}

export async function toggleSideFilters(page: Page, open: boolean): Promise<void> {
  const button = page.locator('[data-test-id="ConsoleMenuToggleButton"]');
  const state = await button.getAttribute("data-test-state");
  const isOpen = state === "open";
  if (isOpen !== open) {
    await debugPrint(
      page,
      `${chalk.bold(open ? "Opening" : "Closing")} the side filters panel`,
      "toggleSideFilters"
    );

    await button.click();
  }
}

export async function verifyConsoleMessage(
  page: Page,
  expected: Expected,
  messageType?: MessageType,
  expectedCount?: number
) {
  await debugPrint(
    page,
    `Verifying the presence of a console message${
      messageType ? ` of type "${chalk.bold(messageType)}" ` : " "
    }with text "${chalk.bold(expected)}"`,
    "verifyConsoleMessage"
  );

  const messages = await findConsoleMessage(page, expected, messageType);
  await verifyExpectedCount(messages, expectedCount);
}

export async function verifyConsoleMessageObjectContents(
  page: Page,
  expected: Expected,
  contents: string[]
) {
  const objectInspector = (await findConsoleMessage(page, expected)).locator(
    '[data-test-name="LogContents"]'
  );
  toggleExpandable(page, { scope: objectInspector, targetState: "open" });
  await objectInspector
    .locator('[data-test-name="ExpandableChildren"] [data-test-name="KeyValue"]')
    .first()
    .waitFor();
  const actualContents = (
    await objectInspector.locator('[data-test-name="ExpandableChildren"]').first().innerText()
  ).split("\n");
  expect(actualContents).toStrictEqual(contents);
}

export async function verifyEagerEvaluationResult(page: Page, expected: Expected) {
  const result = page.locator(
    `[data-test-id="ConsoleTerminalInputEagerEvaluationResult"]:has-text('${expected}')`
  );
  await verifyExpectedCount(result, 1);
}

export async function verifyEvaluationResult(
  page: Page,
  expected: Expected,
  expectedCount?: number
) {
  await debugPrint(
    page,
    `Verifying the presence of an evaluation result with text "${chalk.bold(expected)}"`,
    "verifyConsoleMessage"
  );

  const messages = page.locator(
    `[data-test-name="TerminalExpression-Result"]:has-text('${expected}')`
  );
  await verifyExpectedCount(messages, expectedCount);
}

export async function verifyExpectedCount(locator: Locator, expectedCount?: number) {
  if (expectedCount != null) {
    // Verify a specific number of messages
    await waitFor(async () => {
      const count = await locator.count();
      if (count !== expectedCount) {
        throw `Expected ${expectedCount} messages, but found ${count}`;
      }
    });
  } else {
    // Or just verify that there was at least one
    const message = locator.first();
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
  await debugPrint(
    page,
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

  await debugPrint(
    page,
    `Verifying console has trimmed ${beforeString} before and ${afterString} after`,
    "verifyTrimmedConsoleMessages"
  );

  await waitFor(async () => {
    const beforeCountLocator = page.locator('[data-test-id="MessagesList-TrimmedBeforeCount"]');
    const afterCountLocator = page.locator('[data-test-id="MessagesList-TrimmedAfterCount"]');

    let actualBefore;
    if (expectedBefore === 0 && (await beforeCountLocator.count()) === 0) {
      actualBefore = "0";
    } else {
      actualBefore = await beforeCountLocator.textContent();
    }

    let actualAfter;
    if (expectedAfter === 0 && (await afterCountLocator.count()) === 0) {
      actualAfter = "0";
    } else {
      actualAfter = await afterCountLocator.textContent();
    }

    if (actualBefore !== expectedBefore.toString() || actualAfter !== expectedAfter.toString()) {
      throw `Expected ${expectedBefore} before and ${expectedAfter} after, but found ${actualBefore} before and ${actualAfter} after`;
    }
  });
}

export async function warpToMessage(page: Page, text: string, line?: number) {
  await openConsolePanel(page);

  const messages = await findConsoleMessage(page, text);
  const message = messages.first();
  await message.waitFor();

  await seekToConsoleMessage(page, message, line);
}

export async function warpToLastMessage(page: Page, text: string, line?: number) {
  await openConsolePanel(page);

  const messages = await findConsoleMessage(page, text);
  const message = messages.last();
  await message.waitFor();

  await seekToConsoleMessage(page, message, line);
}

export async function setConsoleMessageAsFocusStart(page: Page, message: Locator) {
  await debugPrint(page, `Setting focus range start`, "setConsoleMessageAsFocusStart");

  await openContextMenu(message);
  await page.locator('[data-test-id="ConsoleContextMenu-SetFocusStartButton"]').click();
}

export async function setConsoleMessageAsFocusEnd(page: Page, message: Locator) {
  await debugPrint(page, `Setting focus range end`, "setConsoleMessageAsFocusEnd");

  await openContextMenu(message);
  await page.locator('[data-test-id="ConsoleContextMenu-SetFocusEndButton"]').click();
}

export async function waitForTerminal(page: Page) {
  await page.locator('[data-test-id="ConsoleTerminalInput"]').waitFor();
}

export async function openContextMenu(listItem: Locator, options: { useLeftClick?: boolean } = {}) {
  const { useLeftClick = false } = options;

  // Click to the left of the list item to avoid accidentally clicking on an Inspector instance
  // Inspector has its own context menu with "copy object"
  await listItem.hover();
  await listItem.click({ button: useLeftClick ? "left" : "right", position: { x: 10, y: 10 } });
}

export async function setLogpointBadge(page: Page, message: Locator, badge: Badge | null) {
  await openContextMenu(message);
  await page.locator(`[data-test-id="ConsoleContextMenu-Badge-${badge}"]`).click();
}

export async function verifyLogpointBadge(message: Locator, badge: Badge | null) {
  const badgeLocator = message.locator(`[data-test-name="LogpointBadge"]`);
  expect(await badgeLocator.getAttribute("data-test-badge")).toBe(badge);
}
