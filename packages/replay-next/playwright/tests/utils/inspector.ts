import { Locator, Page, expect } from "@playwright/test";

import { debugPrint, delay, waitFor } from "./general";

export async function findClientValues(
  page: Page,
  partialText: string,
  locator: Locator | null = null
): Promise<Locator> {
  await debugPrint(
    page,
    `Searching for client values with text "${partialText}"`,
    "findClientValues"
  );

  const locatorOrPage: Locator | Page = locator || page;
  return locatorOrPage.locator(`[data-test-name="ClientValue"]`, { hasText: partialText });
}

export async function findExpandables(
  page: Page,
  partialText: string,
  locator: Locator | null = null
): Promise<Locator> {
  await debugPrint(page, `Searching for expandables with text "${partialText}"`, "findExpandables");

  const locatorOrPage: Locator | Page = locator || page;
  return locatorOrPage.locator(`[data-test-name="Expandable"]`, { hasText: partialText });
}

export async function findKeyValues(
  page: Page,
  partialText: string,
  locator: Locator | null = null
): Promise<Locator> {
  await debugPrint(page, `Searching for key values with text "${partialText}"`, "findKeyValues");

  const locatorOrPage: Locator | Page = locator || page;
  return locatorOrPage.locator(`[data-test-name="KeyValue"]`, { hasText: partialText });
}

export async function toggleExpandable<T>(
  page: Page,
  options: {
    expanded?: boolean;
    expandableLocator?: Locator;
    partialText?: string;
    scope?: Locator;
  }
): Promise<void> {
  const { expanded: nextExpanded = true, scope = page, partialText } = options;

  let { expandableLocator } = options;
  if (expandableLocator == null) {
    expandableLocator = scope
      .locator(`[data-test-name="Expandable"]`, { hasText: partialText })
      .last();
  }

  // Grab a reference to the specific Expandable we are about to click.
  // We'll want to verify updated state after the click,
  // at which point the .last() locator may resolve to a different element.
  const elementHandle = await expandableLocator.elementHandle();

  const prevState = await expandableLocator.getAttribute("data-test-state");
  const prevExpanded = prevState === "open";
  if (prevExpanded !== nextExpanded) {
    const actionPrefix = nextExpanded ? "Expanding toggle" : "Collapsing toggle";
    const action = partialText ? `${actionPrefix} with text "${partialText}"` : actionPrefix;
    await debugPrint(page, action, "toggleExpandable");

    const button = expandableLocator.locator(`[role="button"]`);
    await button.click();

    // Wait for element to open/close.
    const nextState = nextExpanded ? "open" : "closed";
    await waitFor(async () => {
      const currentState = await elementHandle?.getAttribute("data-test-state");
      expect(currentState).toBe(nextState);
    });

    // If we've opened the expandable, wait for its content to finish loading.
    if (nextExpanded) {
      await waitFor(async () => {
        const html = await elementHandle?.innerHTML();
        expect(html).not.toMatch(/data-test-name=['"]Loader['"]/);
      });
    }
  }
}
