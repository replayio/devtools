import { Locator, Page } from "@playwright/test";
import chalk from "chalk";

import { waitForPaused } from "./pause-information-panel";
import { Expected, MessageType } from "./types";
import { debugPrint } from "./utils";

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

export async function executeTerminalExpression(page: Page, text: string): Promise<void> {
  debugPrint(`Executing terminal expression "${chalk.bold(text)}"`, "executeTerminalExpression");

  await openConsolePanel(page);

  const consoleRoot = page.locator('[data-test-id="ConsoleRoot"]');

  // Wait for the Console to stop loading
  await consoleRoot.locator("text=Unavailable...").waitFor({ state: "hidden" });

  const term = page.locator('[data-test-id="JSTerm"]');

  const textArea = term.locator("textarea");
  await textArea.focus();
  await textArea.type(text);
  await textArea.press("Enter");
}

export async function executeAndVerifyTerminalExpression(
  page: Page,
  text: string,
  expected: Expected
): Promise<void> {
  await openConsolePanel(page);
  await executeTerminalExpression(page, text);
  await verifyConsoleMessage(page, expected, "terminal-expression");
  await clearConsoleEvaluations(page);
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

export async function openConsolePanel(page: Page): Promise<void> {
  await page.locator('[data-test-id="PanelButton-console"]').click();
}

export function findConsoleMessage(
  page: Page,
  expected?: Expected,
  messageType?: MessageType
): Locator {
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

export async function openMessageSource(message: Locator): Promise<void> {
  const sourceLink = getMessageSourceLink(message);
  const textContent = await sourceLink.textContent();

  debugPrint(`Opening message source "${chalk.bold(textContent)}"`, "openMessageSource");

  await sourceLink.click();
}

export async function seekToConsoleMessage(page: Page, consoleMessage: Locator): Promise<void> {
  const textContent = await consoleMessage.textContent();

  debugPrint(`Seeking to message "${chalk.bold(textContent)}"`, "seekToConsoleMessage");

  await consoleMessage.hover();
  await consoleMessage.locator('[data-test-id="ConsoleMessageHoverButton"]').click();
}

export async function warpToMessage(page: Page, text: string, line?: number) {
  const message = await findConsoleMessage(page, text);
  await message.hover();

  const warpButton = message.locator('[data-test-id="ConsoleMessageHoverButton"]');
  await warpButton.hover();
  await warpButton.click();

  await waitForPaused(page, line);
}

export async function verifyConsoleMessage(
  page: Page,
  expected: Expected,
  messageType?: MessageType
) {
  debugPrint(
    `Verifying the presence of a console message of type "${chalk.bold(
      messageType
    )}" with text "${chalk.bold(expected)}"`,
    "verifyConsoleMessage"
  );

  const message = findConsoleMessage(page, expected, messageType).first();
  await message.waitFor();
}
