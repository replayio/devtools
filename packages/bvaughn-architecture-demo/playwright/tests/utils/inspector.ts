import { Page } from "@playwright/test";

export async function toggleExpandable<T>(
  page: Page,
  partialText: string,
  expanded: boolean = true
): Promise<void> {
  const expandable = page.locator(`[data-test-name="Expandable"]`, { hasText: partialText }).last();

  const isExpanded = await expandable.evaluate(
    'node => node.getDataAttribute("data-test-state") === "opened"'
  );

  if (isExpanded !== expanded) {
    const button = expandable.locator(`[role="button"]`);
    await button.click();
  }
}
