import { Locator, Page, expect } from "@playwright/test";

import { openConsolePanel, warpToMessage } from "./console-panel";
import { openReactDevtoolsPanel as openReactDevtoolsPanelOld } from "./legacy-react-devtools-panel";
import { debugPrint, waitFor } from "./utils";

export async function enableComponentPicker(page: Page) {
  const button = page.locator('[data-test-id="ReactDevTools-InspectButton"]');
  const enabled = await isComponentPickerEnabled(page);
  if (!enabled) {
    await debugPrint(page, `Enabling React DevTools component picker`, "enableComponentPicker");

    await button.click();
    await expect(await isComponentPickerEnabled(page)).toBe(true);
  }
}

export async function getAllVisibleComponentNames(page: Page) {
  const list = getReactDevToolsList(page);
  const rows = list.locator('[data-test-name="ReactDevToolsListItem"]');

  const count = await rows.count();
  const componentNames: string[] = [];

  for (let index = 0; index < count; index++) {
    const row = rows.nth(index);
    const name = await getComponentName(row);

    componentNames.push(name);
  }

  return componentNames;
}

export async function getComponentName(row: Locator): Promise<string> {
  const name = await row.locator('[data-test-name="ReactDevTools-Name"]').textContent();
  return name ?? "";
}

export async function getComponentSearchResultsCount(
  page: Page
): Promise<{ current: number; total: number } | null> {
  const searchResults = page.locator('[data-test-id="ReactDevTools-SearchResults"]');
  if (!(await searchResults.isVisible())) {
    return null;
  }

  const text = await searchResults.textContent();
  if (!text) {
    return null;
  }

  const [currentString, totalString] = text.split(" of ");
  return { current: parseInt(currentString), total: parseInt(totalString) };
}

export function getInspectedHook(page: Page, name: string) {
  return page.locator(`[data-test-name="Hook-${name}"]`);
}

export function getReactComponents(page: Page) {
  return page.locator('[data-test-name="ReactDevToolsListItem"]');
}

export function getReactDevToolsList(page: Page) {
  return page.locator('[data-test-id="ReactDevToolsList"]');
}

export function getReactDevToolsPanel(page: Page) {
  return page.locator('[data-test-id="ReactDevToolsPanel"]');
}

export function getSearchInput(page: Page) {
  return page.locator('[data-test-id="ReactSearchInput"]');
}

export function getSelectedRow(page: Page) {
  const list = getReactDevToolsList(page);
  return list.locator(`[data-test-name="ReactDevToolsListItem"][data-selected]`);
}

export function getViewSourceButton(page: Page) {
  const panel = getReactDevToolsPanel(page);
  return panel.locator('[title="Jump to definition"]');
}

export async function isComponentPickerEnabled(page: Page) {
  const button = page.locator('[data-test-id="ReactDevTools-InspectButton"]');
  const state = await button.getAttribute("data-state");
  return state === "active";
}

export async function jumpToMessageAndCheckComponents(
  page: Page,
  message: string,
  componentCount: number
) {
  await openConsolePanel(page);
  await warpToMessage(page, message);
  await openReactDevtoolsPanel(page);
  await waitForReactComponentCount(page, componentCount);
}

export async function openReactDevtoolsPanel(page: Page) {
  await openReactDevtoolsPanelOld(page);
}

export async function searchComponents(page: Page, text: string) {
  const input = getSearchInput(page);

  await waitFor(async () => {
    await expect(await input.isEnabled()).toBe(true);
  });

  await input.focus();
  await input.press("Escape"); // Clear/reset
  await input.type(text);
  await input.press("Enter");

  const searchResults = page.locator('[data-test-id="ReactDevTools-SearchResults"]');
  await searchResults.waitFor();
}

export async function verifyInspectedPropertyValue(
  page: Page,
  category: "Hooks" | "Props",
  name: string,
  expectedValue: string
): Promise<void> {
  await debugPrint(
    page,
    `Expect property "${name}" to have value "${expectedValue}"`,
    "verifyInspectedPropertyValue"
  );

  const section =
    category === "Hooks"
      ? page.locator('[data-test-id="ReactDevTools-Section-Hooks"]')
      : page.locator('[data-test-id="ReactDevTools-Section-Props"]');

  const keyValue = section.locator(`[data-test-name="KeyValue"]`, { hasText: name });
  const value = keyValue.locator('[data-test-name="ClientValue"]');
  const actualValue = await value.textContent();

  expect(actualValue).toBe(expectedValue);
}

export async function verifyReactComponentIsSelected(component: Locator) {
  await expect(component).toHaveAttribute("data-selected", "true");
}

export async function verifySearchResults(
  page: Page,
  expectations: {
    currentNumber?: number;
    name?: string;
    totalNumber?: number;
  }
) {
  const {
    currentNumber: expectedCurrent,
    name: expectedName,
    totalNumber: expectedTotal,
  } = expectations;

  if (expectedCurrent != null || expectedTotal != null) {
    await waitFor(async () => {
      const { current: actualCurrent, total: actualTotal } =
        (await getComponentSearchResultsCount(page)) ?? {};

      if (expectedCurrent != null) {
        expect(actualCurrent).toBe(expectedCurrent);
      }

      if (expectedTotal != null) {
        expect(actualTotal).toBe(expectedTotal);
      }
    });
  }

  if (expectedName != null) {
    await verifySelectedComponentName(page, expectedName);
  }
}

export async function verifySelectedComponentName(page: Page, expectedName: string) {
  await debugPrint(page, `Expect "${expectedName}" to be selected`, "verifySelectedComponentName");

  await waitFor(async () => {
    const actualName = await getComponentName(getSelectedRow(page));
    expect(actualName).toBe(expectedName);
  });
}

export async function waitForReactComponentCount(page: Page, expected: number) {
  const components = getReactComponents(page);
  return waitFor(async () => expect(await components.count()).toBe(expected));
}
