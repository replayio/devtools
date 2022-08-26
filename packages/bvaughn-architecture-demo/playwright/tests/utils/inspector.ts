import { Page } from "@playwright/test";

export async function toggleExpandable<T>(
  page: Page,
  partialText: string,
  expanded: boolean = true
): Promise<void> {
  const locator = page.locator(`[data-test-name="Expandable"]`, { hasText: partialText }).last();

  const isExpanded = await locator.evaluate(
    'node => node.getDataAttribute("data-test-state") === "opened"'
  );

  if (isExpanded !== expanded) {
    await locator.click();
  }
}
