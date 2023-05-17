import { Locator, Page } from "@playwright/test";

export async function selectContextMenuItem(
  page: Page,
  options: {
    contextMenuItemTestId?: string;
    contextMenuItemTestName?: string;
    contextMenuItemText?: string;
    contextMenuTestId?: string;
    contextMenuTestName?: string;
  }
) {
  const {
    contextMenuItemTestId,
    contextMenuItemTestName,
    contextMenuItemText,
    contextMenuTestId,
    contextMenuTestName,
  } = options;

  let contextMenuLocator: Locator;
  if (contextMenuTestId) {
    contextMenuLocator = page.locator(`[data-test-id="${contextMenuTestId}"]`);
  } else if (contextMenuTestName) {
    contextMenuLocator = page.locator(`[data-test-name="${contextMenuTestName}"]`);
  } else if (contextMenuItemText) {
    contextMenuLocator = page.locator(
      `[data-test-name="ContextMenu"]:has-text("${contextMenuItemText}")`
    );
  } else {
    contextMenuLocator = page.locator('[data-test-name="ContextMenu"]');
  }

  let contextMenuItemLocator: Locator;
  if (contextMenuItemTestId) {
    contextMenuItemLocator = contextMenuLocator.locator(
      `[data-test-id="${contextMenuItemTestId}"]`
    );
  } else if (contextMenuItemTestName) {
    contextMenuItemLocator = contextMenuLocator.locator(
      `[data-test-name="${contextMenuItemTestName}"]`
    );
  } else if (contextMenuItemText) {
    contextMenuItemLocator = contextMenuLocator.locator(
      `[data-test-name="ContextMenuItem"]:has-text("${contextMenuItemText}")`
    );
  } else {
    throw Error("Insufficient options provided to identify a context menu item");
  }

  await contextMenuItemLocator.click();
}
