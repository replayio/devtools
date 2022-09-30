import { Locator } from "@playwright/test";

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
