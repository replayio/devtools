import { Page, expect } from "@playwright/test";

import { toggleExpandable } from "./utils";

export async function verifyErrorDialog(
  page: Page,
  {
    expectedDetails,
    expectedTitle,
    expectedType,
  }: {
    expectedDetails?: string;
    expectedTitle?: string;
    expectedType: "expected" | "unexpected";
  }
) {
  const dataTestId = expectedType === "expected" ? "ExpectedError" : "UnexpectedErrorDetails";

  const dialog = page.locator(`[data-test-id="${dataTestId}"]`);
  await dialog.waitFor({ timeout: 10_000 });

  expect(await dialog.isVisible()).toBe(true);

  if (expectedTitle != null) {
    const title = dialog.locator(`[data-test-name="ErrorTitle"]`);

    expect(await title.textContent()).toContain(expectedTitle);
  }

  if (expectedDetails != null) {
    if (expectedType === "unexpected") {
      await toggleExpandable(page, {
        scope: dialog,
        targetState: "open",
      });
    }

    const details = dialog.locator(`[data-test-name="ErrorDetails"]`);

    expect(await details.textContent()).toContain(expectedDetails);
  }
}
