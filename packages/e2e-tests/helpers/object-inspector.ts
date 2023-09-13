import { Locator } from "@playwright/test";

import { getByTestName } from "./utils";

export async function getPropertyValue(objectInspector: Locator, propertyName: string) {
  const expander = objectInspector.locator('[data-test-name="Expandable"]').first();
  const state = await expander.getAttribute("data-test-state");
  if (state === "closed") {
    expander.click();
  }

  const property = objectInspector.locator(
    `[data-test-name="ExpandableChildren"] [data-test-name="KeyValue"]:has([data-test-name="KeyValue-Header"]:text-is("${propertyName}"))`
  );
  await property.waitFor();
  const propertyValue = property.locator('[data-test-name="ClientValue"]');
  return await propertyValue.innerText();
}

export async function getGetterValue(objectInspector: Locator, propertyName: string) {
  const expander = objectInspector.locator('[data-test-name="Expandable"]').first();
  const state = await expander.getAttribute("data-test-state");
  if (state === "closed") {
    expander.click();
  }

  const property = objectInspector.locator(
    `[data-test-name="ExpandableChildren"] [data-test-name="GetterRenderer-Name"]:text-is("${propertyName}"))`
  );
  await property.waitFor();
  const getterButton = property.locator('[data-test-name="GetterRenderer-LoadValueButton"]');

  if (await getterButton.isVisible({ timeout: 250 })) {
    await getterButton.click();
  }
  const propertyValue = property.locator('[data-test-name="ClientValue"]');
  return await propertyValue.innerText();
}

export async function getKeyValueEntry(
  locator: Locator,
  header: string
): Promise<Locator | undefined> {
  const keyValues = getByTestName(locator, "KeyValue");
  const numItems = await keyValues.count();
  const reHeader = new RegExp(`^${header}`, "i");
  for (let i = 0; i < numItems; i++) {
    const keyValueLocator = keyValues.nth(i);
    const headerText = await getKeyValueEntryHeader(keyValueLocator);
    if (!headerText) {
      return undefined;
    }
    if (reHeader.test(headerText)) {
      return keyValueLocator;
    }
  }

  return undefined;
}

export async function getKeyValueEntryHeader(locator: Locator) {
  const headerField = getByTestName(locator, "KeyValue-Header").first();
  return headerField.textContent();
}

export async function getKeyValueEntryValue(locator: Locator) {
  const valueField = getByTestName(locator, "ClientValue").first();
  // Complex values like objects or DOM nodes do not have
  // a "ClientValue" section. Skip those.
  if (await valueField.isVisible()) {
    return valueField.textContent();
  }
  return "";
}
