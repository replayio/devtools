import { Locator, Page, expect } from "@playwright/test";
import chalk from "chalk";

import { debugPrint, getCommandKey, getElementCount, waitFor } from "./general";
import { Expected, MessageType } from "./types";

type ToggleName = "errors" | "exceptions" | "logs" | "nodeModules" | "timestamps" | "warnings";

export async function addTerminalExpression(page: Page, text: string): Promise<void> {
  await debugPrint(page, `Adding terminal expression "${chalk.bold(text)}"`, "addTerminalMessage");

  const input = page.locator("[data-test-id=ConsoleTerminalInput]");
  await input.waitFor();
  await input.focus();
  await input.fill(text);
  await page.keyboard.press("Enter");
  await verifyConsoleMessage(page, text, "terminal-expression", 1);
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

export async function focusOnConsole(page: Page) {
  await debugPrint(page, `Focusing on console`, "focusOnConsole");

  const consoleRoot = page.locator('[data-test-id="ConsoleRoot"]');
  await expect(consoleRoot).toBeVisible();
  await consoleRoot.focus();
  await expect(consoleRoot).toBeFocused();
}

export async function hideSearchInput(page: Page) {
  const count = await getElementCount(page, '[data-test-id="ConsoleSearchInput"]');
  if (count === 0) {
    await debugPrint(page, `No search inputs to hide`, "hideSearchInput");
  } else {
    await debugPrint(page, `Hiding search input`, "hideSearchInput");

    await page.focus('[data-test-id="ConsoleSearchInput"]');
    await page.keyboard.press("Escape");
  }
}

export async function locateMessage<T>(
  page: Page,
  messageType: MessageType,
  partialText?: string
): Promise<Locator> {
  await debugPrint(
    page,
    partialText
      ? `Locating message of type "${chalk.bold(messageType)}" containing text "${chalk.bold(
          partialText
        )}"`
      : `Locating message of type "${chalk.bold(messageType)}"`,
    "locateMessage"
  );

  const locator = messageLocator(page, messageType, partialText);

  let loop = 0;

  while (true) {
    const count = await locator.count();

    if (count === 0) {
      if (loop++ > 25) {
        let message = `Could not locate message type "${messageType}"`;
        if (partialText) {
          message += ` with text "${partialText}`;
        }
        throw new Error(message);
      }

      await new Promise(resolve => setTimeout(resolve, 50));
    } else {
      return locator;
    }
  }
}

export async function openContextMenu(listItem: Locator) {
  // Click to the left of the list item to avoid accidentally clicking on an Inspector instance
  // Inspector has its own context menu with "copy object"
  await listItem.click({ button: "right", position: { x: 10, y: 10 } });
}

export function messageLocator(
  page: Page,
  messageType: MessageType,
  partialText?: string
): Locator {
  return page.locator(`[data-test-name=Message][data-test-message-type="${messageType}"]`, {
    hasText: partialText,
  });
}

export async function seekToMessage(page: Page, messageListItem: Locator) {
  await debugPrint(
    page,
    `Seeking to message "${chalk.bold(await messageListItem.textContent())}`,
    "seekToMessage"
  );

  await messageListItem.hover();
  await page.click('[data-test-id="ConsoleMessageHoverButton"]');
}

export async function showSearchInput(page: Page) {
  await debugPrint(page, `Showing search input`, "showSearchInput");

  await focusOnConsole(page);

  await page.keyboard.down(getCommandKey());
  await page.keyboard.type("f");
  await page.keyboard.up(getCommandKey());

  const input = page.locator(`[data-test-id=ConsoleSearchInput]`);
  await expect(input).toBeVisible();
}

export async function toggleSideMenu(page: Page, open: boolean) {
  await page.waitForSelector(`[data-test-id="ConsoleMenuToggleButton"]`);

  const isOpen = await page.evaluate(() => {
    const button = document.querySelector(`[data-test-id="ConsoleMenuToggleButton"]`);
    return button?.getAttribute("data-test-state") === "open";
  }, []);

  if (isOpen !== open) {
    await debugPrint(
      page,
      `${chalk.bold(open ? "Expanding" : "Collapsing")} Console side menu`,
      "toggleSideMenu"
    );

    await page.click(`[data-test-id="ConsoleMenuToggleButton"]`);
  }
}

export async function toggleProtocolMessages(page: Page, on: boolean) {
  await toggleSideMenu(page, true);

  await toggleProtocolMessage(page, "errors", on);
  await toggleProtocolMessage(page, "exceptions", on);
  await toggleProtocolMessage(page, "logs", on);
  await toggleProtocolMessage(page, "warnings", on);
}

export async function toggleProtocolMessage(page: Page, name: ToggleName, on: boolean) {
  await page.waitForSelector(`[data-test-id="FilterToggle-${name}"] input`);

  const isEnabled = await page.evaluate(
    name => {
      const input = document.querySelector(`[data-test-id="FilterToggle-${name}"] input`);
      return (input as HTMLInputElement).checked;
    },
    [name]
  );

  if ((isEnabled && !on) || (!isEnabled && on)) {
    await debugPrint(
      page,
      `${chalk.bold(on ? "Enabling" : "Disabling")} Console filter "${chalk.bold(name)}"`,
      "toggleProtocolMessage"
    );

    await page.click(`[data-test-id="FilterToggle-${name}"]`);
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

  if (expectedCount != null) {
    // Verify a specific number of messages
    await waitFor(
      async () => {
        const count = await messages.count();
        if (count !== expectedCount) {
          throw `Expected ${expectedCount} messages, but found ${count}`;
        }
      },
      {
        // For console log points, it can take quite a while for the messages to finish
        // eval-ing their expressions, so this needs to be much longer than in production.
        timeout: process.env.BACKEND_CI ? 60_000 : undefined,
      }
    );
  } else {
    // Or just verify that there was at least one
    const message = messages.first();
    await message.waitFor();
  }
}

export async function filterByText(page: Page, text: string) {
  await page.fill("[data-test-id=ConsoleFilterInput]", text);
}
