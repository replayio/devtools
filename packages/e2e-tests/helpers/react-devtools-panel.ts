import { expect, Locator, Page } from "@playwright/test";
import { waitFor } from ".";

export async function checkInspectedItemValue(item: Locator, expectedValue: string) {
  const value = await getInspectedItemValue(item);
  expect(value).toBe(expectedValue);
}

export async function enableComponentPicker(page: Page) {
  await page.locator("[data-react-devtools-portal-root] [class^=ToggleOff]").click();
  await page.locator("[data-react-devtools-portal-root] [class^=ToggleOn]").waitFor();
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
