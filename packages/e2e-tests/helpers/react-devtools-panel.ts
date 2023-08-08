import { Locator, Page, expect } from "@playwright/test";

import { openConsolePanel, warpToMessage } from "./console-panel";
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

async function isReactPanelComponentPickerEnabled(page: Page) {
  const locator = page.locator("[data-testname=ReactPanelPickerStatus]");
  const statusString = await locator.getAttribute("data-component-picker-active");
  return statusString === "true";
}

async function isRDTInternalComponentPickerEnabled(page: Page) {
  const componentPicker = getComponentPickerButton(page);
  const internalToggleClasses = await getElementClasses(componentPicker);
  const internalToggleEnabled = internalToggleClasses.some(c => c.startsWith("ToggleOn"));
  return internalToggleEnabled;
}

export async function isComponentPickerEnabled(page: Page) {
  const internalToggleEnabled = await isRDTInternalComponentPickerEnabled(page);

  let panelPickerEnabled: boolean = false;
  await waitFor(async () => {
    // It takes time for our parent panel to receive the message.
    // Wait until they agree on the status.
    panelPickerEnabled = await isReactPanelComponentPickerEnabled(page);

    expect(internalToggleEnabled).toBe(panelPickerEnabled);
  });
  return internalToggleEnabled && panelPickerEnabled;
}

export async function enableComponentPicker(page: Page) {
  const componentPicker = getComponentPickerButton(page);
  // Check just the toggle button here, not the outer panel status
  if (await isRDTInternalComponentPickerEnabled(page)) {
    await componentPicker.click();
    await waitFor(async () => expect(await isComponentPickerEnabled(page)).toBe(false));
  }
  await componentPicker.click();
  await waitFor(async () => expect(await isComponentPickerEnabled(page)).toBe(true));

  return componentPicker;
}

export function getInspectedItem(page: Page, kind: "Props" | "Hooks", name: string) {
  return page.locator(
    `[data-testname="InspectedElement${kind}Tree"] [class^=Item]:has([class^=Name]:text-is("${name}"))`
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
