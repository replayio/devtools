import { expect, Locator, Page } from "@playwright/test";
import chalk from "chalk";

import { clearTextArea, debugPrint, delay, getCommandKey } from "./general";

export async function addLogPoint(
  page: Page,
  options: {
    content?: string;
    condition?: string;
    lineNumber: number;
    sourceId: string;
  }
) {
  const { content, condition, lineNumber, sourceId } = options;

  await debugPrint(
    page,
    `Adding log point for source "${chalk.bold(sourceId)}" at line ${chalk.bold(lineNumber)}`,
    "addLogPoint"
  );

  await openSourceFile(page, sourceId);
  await goToLine(page, lineNumber);

  const locator = getSourceLineLocator(page, sourceId, lineNumber);

  // Hover over the line number itself, not the line, to avoid triggering protocol preview requests.
  await locator
    .locator(`[data-test-id="SourceLine-LineNumber-${lineNumber}"]`)
    .hover({ force: true });

  const button = locator.locator('[data-test-name="AddPointButton"]');
  await button.click({ force: true });

  if (content || condition) {
    await editLogPointText(page, options);
  }
}

export async function editLogPointText(
  page: Page,
  options: {
    content?: string;
    condition?: string;
    lineNumber: number;
    sourceId: string;
  }
) {
  const { content, condition, lineNumber, sourceId } = options;

  await debugPrint(
    page,
    `Editing log point for source "${chalk.bold(sourceId)}" at line ${chalk.bold(lineNumber)}`,
    "editLogPointText"
  );

  await openSourceFile(page, sourceId);
  await goToLine(page, lineNumber);

  const pointPanelLocator = getPointPanelLocator(page, options.lineNumber);
  if (!(await pointPanelLocator.isVisible())) {
    const locator = getSourceLineLocator(page, sourceId, lineNumber);

    // Hover over the line number itself, not the line, to avoid triggering protocol preview requests.
    await locator
      .locator(`[data-test-id="SourceLine-LineNumber-${lineNumber}"]`)
      .hover({ force: true });
  }

  const editButtonLocator = await pointPanelLocator.locator(
    "[data-test-name=PointPanel-EditButton]"
  );
  const editButtonIsVisible = await editButtonLocator.isVisible();
  if (editButtonIsVisible) {
    await debugPrint(page, `Toggling point to be editable`, "editLogPointText");

    await editButtonLocator.click();
  }

  const contentLocator = pointPanelLocator.locator(`[data-test-name=PointPanel-ContentInput]`);
  if (content != null) {
    await debugPrint(
      page,
      `Setting log point content to "${chalk.bold(content)}"`,
      "editLogPointText"
    );

    await clearTextArea(page, contentLocator);
    await contentLocator.fill(content);
  }

  const conditionLocator = pointPanelLocator.locator(`[data-test-name=PointPanel-ConditionInput]`);
  const isConditionInputVisible = await conditionLocator.isVisible();
  if (condition != null) {
    await debugPrint(
      page,
      `Setting log point condition to "${chalk.bold(condition)}"`,
      "editLogPointText"
    );

    if (!isConditionInputVisible) {
      await pointPanelLocator.locator(`[data-test-name=PointPanel-AddConditionButton]`).click();
    }
    await clearTextArea(page, conditionLocator);
    await conditionLocator.fill(condition);
  }

  const saveButton = pointPanelLocator.locator('[data-test-name="PointPanel-SaveButton"]');
  await saveButton.click({ force: true });
}

export async function focusOnSource(page: Page) {
  await debugPrint(page, "(Re)focus on Source root", "focusOnSource");

  const sourcesRoot = page.locator('[data-test-id="SourcesRoot"]');
  await expect(sourcesRoot).toBeVisible();
  await sourcesRoot.focus();
  await expect(sourcesRoot).toBeFocused();
}

export function getPointPanelLocator(page: Page, lineNumber: number): Locator {
  return page.locator(`[data-test-id=PointPanel-${lineNumber}]`);
}

export function getSourceFileNameSearchResultsLocator(page: Page): Locator {
  return page.locator(`[data-test-id="SourceFileNameSearchResults"]`);
}

export function getSourceLineLocator(page: Page, sourceId: string, lineNumber: number): Locator {
  const sourceLocator = getSourceLocator(page, sourceId);
  return sourceLocator.locator(`[data-test-id="SourceLine-${lineNumber}"]`);
}

export function getSourceLocator(page: Page, sourceId: string): Locator {
  return page.locator(`[data-test-id="Source-${sourceId}"]`);
}

export function getSourceTabLocator(page: Page, sourceId: string): Locator {
  return page.locator(`[data-test-id="SourceTab-${sourceId}"]`);
}

export function getSearchSourceLocator(page: Page): Locator {
  return page.locator(`[data-test-id="SourceSearch"]`);
}

export async function goToLine(page: Page, lineNumber: number) {
  const lineLocator = page.locator(`[data-test-id="SourceLine-${lineNumber}"]`);
  const lineIsVisible = await lineLocator.isVisible();
  if (lineIsVisible) {
    return;
  }

  await debugPrint(page, `Going to source line ${chalk.bold(lineNumber)}`, "goToLine");

  await focusOnSource(page);

  await page.keyboard.down(getCommandKey());
  await page.keyboard.type("o");
  await page.keyboard.up(getCommandKey());

  const input = page.locator('[data-test-id="SourceFileNameSearchInput"]');
  await expect(input).toBeFocused();

  await clearTextArea(page, input);
  await page.keyboard.type(`:${lineNumber}`);
  await page.keyboard.press("Enter");

  await expect(lineLocator).toBeVisible();

  // Give the list time to render and settle.
  await delay(1000);
}

export async function openSourceFile(page: Page, sourceId: string) {
  const sourceTabLocator = getSourceTabLocator(page, sourceId);
  const sourceTabIsVisible = await sourceTabLocator.isVisible();
  if (sourceTabIsVisible) {
    await sourceTabLocator.click();
  } else {
    await debugPrint(page, `Opening source with id "${chalk.bold(sourceId)}"`, "openSourceFile");

    await page.locator(`[data-test-id="SourceExplorerSource-${sourceId}"]`).click();
  }
}

export async function searchSourceText(page: Page, text: string) {
  await focusOnSource(page);

  await debugPrint(page, `Searching source for text "${chalk.bold(text)}"`, "searchSourceText");

  await page.keyboard.down(getCommandKey());
  await page.keyboard.type("f");
  await page.keyboard.up(getCommandKey());

  const input = page.locator('[data-test-id="SourceSearchInput"]');
  await expect(input).toBeFocused();

  await clearTextArea(page, input);
  await page.keyboard.type(text);
}

export async function searchSourcesByName(page: Page, text: string) {
  await focusOnSource(page);

  await debugPrint(
    page,
    `Searching source files by name "${chalk.bold(text)}"`,
    "searchSourcesByName"
  );

  await page.keyboard.down(getCommandKey());
  await page.keyboard.type("o");
  await page.keyboard.up(getCommandKey());

  const input = page.locator('[data-test-id="SourceFileNameSearchInput"]');
  await expect(input).toBeFocused();

  await clearTextArea(page, input);
  await page.keyboard.type(text);
}
