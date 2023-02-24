import { Locator, Page } from "@playwright/test";

import { debugPrint, delay } from "./general";

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
    partialText?: string;
    scope?: Locator;
  }
): Promise<void> {
  const { expanded = true, scope = page, partialText } = options;

  const expandable = scope
    .locator(`[data-test-name="Expandable"]`, { hasText: partialText })
    .last();

  const isExpanded = await expandable.evaluate(
    'node => node.getDataAttribute("data-test-state") === "opened"'
  );

  if (isExpanded !== expanded) {
    const actionPrefix = expanded ? "Expanding toggle" : "Collapsing toggle";
    const action = partialText ? `${actionPrefix} with text "${partialText}"` : actionPrefix;
    await debugPrint(page, action, "toggleExpandable");

    const button = expandable.locator(`[role="button"]`);
    await button.click();

    await delay();
  }
}
