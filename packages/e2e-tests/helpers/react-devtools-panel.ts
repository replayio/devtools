import { Locator, Page, expect } from "@playwright/test";

import { getElementClasses, waitFor } from "./utils";

export async function checkInspectedItemValue(item: Locator, expectedValue: string) {
  const value = await getInspectedItemValue(item);
  expect(value).toBe(expectedValue);
}

export function getComponentPickerButton(page: Page) {
  return page.locator(
    "[data-react-devtools-portal-root] div[class^=SearchInput] button[class^=Toggle]"
  );
}

export async function isComponentPickerEnabled(componentPicker: Locator) {
  const classes = await getElementClasses(componentPicker);
  return classes.some(c => c.startsWith("ToggleOn"));
}

export async function enableComponentPicker(page: Page) {
  const componentPicker = getComponentPickerButton(page);
  if (await isComponentPickerEnabled(componentPicker)) {
    await componentPicker.click();
  }
  await componentPicker.click();
  await waitFor(async () => expect(await isComponentPickerEnabled(componentPicker)).toBe(true));

  return componentPicker;
}

export function getInspectedItem(page: Page, kind: "Props" | "Hooks", name: string) {
  return page.locator(
    `[data-test-name="InspectedElement${kind}Tree"] [class^=Item]:has([class^=Name]:text-is("${name}"))`
  );
}

export function getInspectedItemValue(item: Locator) {
  return item.locator("[class^=Value]").innerText();
}

export function getReactComponents(page: Page) {
  return page.locator("[class^=Tree] [class^=Wrapper]");
}

export async function openReactDevtoolsPanel(page: Page) {
  await page.locator('[data-test-id="PanelButton-react-components"]').click();
}

export async function waitForReactComponentCount(page: Page, expected: number) {
  const components = getReactComponents(page);
  return waitFor(async () => expect(await components.count()).toBe(expected));
}

export async function waitForAndCheckInspectedItem(item: Locator, expectedValue: string) {
  await item.waitFor();
  await checkInspectedItemValue(item, expectedValue);
}
