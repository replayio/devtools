import { Locator } from "@playwright/test";
import chalk from "chalk";
import { waitForPaused } from "./pause-information-panel";

import { Expected, MessageType, Screen } from "./types";
import { debugPrint } from "./utils";

const categoryNames = {
  keyboard: "Keyboard",
  mouse: "Mouse",
  pointer: "Pointer",
  timer: "Timer",
  websocket: "WebSocket",
};

type CategoryKey = keyof typeof categoryNames;

export async function addEventListenerLogpoints(
  screen: Screen,
  eventTypes: string[]
): Promise<void> {
  for (let eventType of eventTypes) {
    const [, categoryKey, eventName] = eventType.split(".");

    debugPrint(
      `Adding event type "${chalk.bold(eventName)}" in category "${chalk.bold(categoryKey)}"`,
      "addEventListenerLogpoints"
    );

    await expandFilterCategory(screen, categoryNames[categoryKey as CategoryKey]);
    await screen.queryByTestId(`EventTypes-${eventType}`).setChecked(true);
  }
}

export async function clearConsoleEvaluations(screen: Screen): Promise<void> {
  await screen.queryByTestId("ClearConsoleEvaluationsButton").click();
}

export async function executeTerminalExpression(screen: Screen, text: string): Promise<void> {
  debugPrint(`Executing terminal expression "${chalk.bold(text)}"`, "executeTerminalExpression");

  await openConsolePanel(screen);

  const consoleRoot = screen.queryByTestId("ConsoleRoot");

  // Wait for the Console to stop loading
  await consoleRoot.locator("text=Unavailable...").waitFor({ state: "hidden" });

  const term = screen.queryByTestId("JSTerm");

  const textArea = term.locator("textarea");
  await textArea.focus();
  await textArea.type(text);
  await textArea.press("Enter");
}

export async function executeAndVerifyTerminalExpression(
  screen: Screen,
  text: string,
  expected: Expected
): Promise<void> {
  await openConsolePanel(screen);
  await executeTerminalExpression(screen, text);
  await verifyConsoleMessage(screen, expected, "terminal-expression");
  await clearConsoleEvaluations(screen);
}

export async function expandFilterCategory(screen: Screen, categoryName: string) {
  debugPrint(
    `Expanding Console event filter category "${chalk.bold(categoryName)}"`,
    "expandFilterCategory"
  );

  const consoleFilters = screen.queryByTestId("ConsoleFilterToggles");

  const categoryLabel = consoleFilters.locator(`[data-test-name="Expandable"]`, {
    hasText: categoryName,
  });

  const state = await categoryLabel.getAttribute("data-test-state");
  if (state === "closed") {
    await categoryLabel.click();
  }
}

export async function openConsolePanel(screen: Screen): Promise<void> {
  await screen.queryByTestId("PanelButton-console").click();
}

export function findConsoleMessage(
  screen: Screen,
  expected?: Expected,
  messageType?: MessageType
): Locator {
  const attributeSelector = messageType
    ? `[data-test-message-type="${messageType}"]`
    : '[data-test-name="Message"]';

  return expected
    ? screen.locator(`${attributeSelector}:has-text("${expected}")`)
    : screen.locator(`${attributeSelector}`);
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

export async function seekToConsoleMessage(screen: Screen, consoleMessage: Locator): Promise<void> {
  const textContent = await consoleMessage.textContent();

  debugPrint(`Seeking to message "${chalk.bold(textContent)}"`, "seekToConsoleMessage");

  await consoleMessage.hover();
  await consoleMessage.locator('[data-test-id="ConsoleMessageHoverButton"]').click();
}

export async function warpToMessage(screen: Screen, text: string, line?: number) {
  const message = await findConsoleMessage(screen, text);
  await message.hover();

  const warpButton = message.locator('[data-test-id="ConsoleMessageHoverButton"]');
  await warpButton.hover();
  await warpButton.click();

  await waitForPaused(screen, line);
}

export async function verifyConsoleMessage(
  screen: Screen,
  expected: Expected,
  messageType?: MessageType
) {
  debugPrint(
    `Verifying the presence of a console message of type "${chalk.bold(
      messageType
    )}" with text "${chalk.bold(expected)}"`,
    "verifyConsoleMessage"
  );

  const message = findConsoleMessage(screen, expected, messageType);
  await message.waitFor();
}
