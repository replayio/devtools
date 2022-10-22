import { Locator, Page } from "@playwright/test";
import { debugPrint } from "./general";

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
    await debugPrint(page, expanded ? "Expanding toggle" : "Collapsing toggle", "toggleExpandable");

    const button = expandable.locator(`[role="button"]`);
    await button.click();
  }
}
