import { expect, Locator, Page } from "@playwright/test";
import chalk from "chalk";

import { clearTextArea, debugPrint, delay, getCommandKey, stopHovering } from "./general";

type Badge = "blue" | "green" | "orange" | "purple" | "unicorn" | "yellow";

type AsyncFunction = () => Promise<void>;

export async function addBreakPoint(
  page: Page,
  options: {
    lineNumber: number;
    sourceId: string;
  }
) {
  const { lineNumber, sourceId } = options;

  await debugPrint(
    page,
    `Adding break point for source "${chalk.bold(sourceId)}" at line ${chalk.bold(lineNumber)}`,
    "addBreakPoint"
  );

  await openSourceFile(page, sourceId);
  await goToLine(page, lineNumber);

  const lineLocator = getSourceLineLocator(page, sourceId, lineNumber);

  await hoverOverLine(page, { lineNumber });

  const toggle = lineLocator.locator('[data-test-name="BreakpointToggle"]');
  const state = await toggle.getAttribute("data-test-state");
  if (state === "off") {
    await toggle.click({ force: true });
  }

  await stopHovering(page);
}

export async function addLogPoint(
  page: Page,
  options: {
    badge?: Badge | null;
    content?: string;
    condition?: string;
    lineNumber: number;
    sourceId: string;
  }
) {
  const { badge, condition, content, lineNumber, sourceId } = options;

  await debugPrint(
    page,
    `Adding log point for source "${chalk.bold(sourceId)}" at line ${chalk.bold(lineNumber)}`,
    "addLogPoint"
  );

  await openSourceFile(page, sourceId);
  await goToLine(page, lineNumber);

  const lineLocator = getSourceLineLocator(page, sourceId, lineNumber);

  await hoverOverLine(page, { lineNumber });

  const toggle = lineLocator.locator('[data-test-name="LogPointToggle"]');
  const state = await toggle.getAttribute("data-test-state");
  if (state === "off") {
    await toggle.click({ force: true });
  }

  if (condition !== undefined || content !== undefined) {
    await editLogPoint(page, options);
  }

  await toggleLogPointBadge(page, { badge, lineNumber, sourceId });

  await stopHovering(page);
}

export async function continueTo(
  page: Page,
  options: {
    direction: "next" | "previous";
    lineNumber: number;
    sourceId?: string;
  }
) {
  const { direction, lineNumber, sourceId } = options;

  await debugPrint(
    page,
    sourceId == null
      ? `Continuing to ${chalk.bold(direction)} line ${chalk.bold(lineNumber)}`
      : `Continuing to ${chalk.bold(direction)} line ${chalk.bold(
          lineNumber
        )} for source "${chalk.bold(sourceId)}"`,
    "continueToNext"
  );

  if (sourceId != null) {
    await openSourceFile(page, sourceId);
  }
  await goToLine(page, lineNumber);

  const lineLocator = page.locator(`[data-test-id="SourceLine-${lineNumber}"]`);

  const stopHovering = await hoverOverLine(page, {
    lineNumber,
    withMetaKey: true,
    withShiftKey: direction === "previous",
  });

  const button = lineLocator.locator('[data-test-name="ContinueToButton"]');
  const state = await button.getAttribute("data-test-state");
  if (direction === state) {
    await button.click();
  }

  await stopHovering();
}

export async function editLogPoint(
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
    "editLogPoint"
  );

  await openSourceFile(page, sourceId);
  await goToLine(page, lineNumber);

  const pointPanelLocator = getPointPanelLocator(page, options.lineNumber);
  if (!(await pointPanelLocator.isVisible())) {
    await hoverOverLine(page, { lineNumber });
  }

  const editButtonLocator = await pointPanelLocator.locator(
    "[data-test-name=PointPanel-EditButton]"
  );
  const editButtonIsVisible = await editButtonLocator.isVisible();
  if (editButtonIsVisible) {
    await debugPrint(page, `Toggling point to be editable`, "editLogPoint");

    await editButtonLocator.click();
  }

  const contentLocator = pointPanelLocator.locator(`[data-test-name=PointPanel-ContentInput]`);
  if (content != null) {
    await debugPrint(page, `Setting log point content to "${chalk.bold(content)}"`, "editLogPoint");

    await clearTextArea(page, contentLocator);
    await contentLocator.fill(content);
  }

  const conditionLocator = pointPanelLocator.locator(`[data-test-name=PointPanel-ConditionInput]`);
  const isConditionInputVisible = await conditionLocator.isVisible();
  if (condition != null) {
    await debugPrint(
      page,
      `Setting log point condition to "${chalk.bold(condition)}"`,
      "editLogPoint"
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

export async function hoverOverLine(
  page: Page,
  options: {
    lineNumber: number;
    withMetaKey?: boolean;
    withShiftKey?: boolean;
  }
): Promise<AsyncFunction> {
  const { lineNumber, withMetaKey, withShiftKey } = options;

  let suffix = "";
  if (withMetaKey || withShiftKey) {
    const keys: string[] = [];
    if (withMetaKey) {
      keys.push("meta");
    }
    if (withShiftKey) {
      keys.push("shift");
    }
    suffix = `with ${chalk.bold(keys.join(" and "))}`;
  }
  await debugPrint(page, `Hovering over line ${chalk.bold(lineNumber)} ${suffix}`, "hoverOverLine");

  await goToLine(page, lineNumber);

  if (withShiftKey) {
    await page.keyboard.down("Shift");
  } else {
    await page.keyboard.up("Shift");
  }
  if (withMetaKey) {
    await page.keyboard.down(getCommandKey());
  } else {
    await page.keyboard.up(getCommandKey());
  }

  // Hover over the line number itself, not the line, to avoid triggering protocol preview requests.
  const lineLocator = page.locator(`[data-test-id="SourceLine-${lineNumber}"]`);
  const numberLocator = lineLocator.locator(`[data-test-id="SourceLine-LineNumber-${lineNumber}"]`);
  await numberLocator.hover({ force: true });

  return async () => {
    await stopHovering(page);
    if (withMetaKey) {
      await page.keyboard.up(getCommandKey());
    }
    if (withShiftKey) {
      await page.keyboard.up("Shift");
    }
  };
}

export async function isContinueToButtonEnabled(
  page: Page,
  options: {
    direction: "previous" | "next";
    lineNumber: number;
  }
): Promise<boolean> {
  const { direction, lineNumber } = options;

  const stopHovering = await hoverOverLine(page, {
    lineNumber,
    withMetaKey: true,
    withShiftKey: direction === "previous",
  });

  const lineLocator = page.locator(`[data-test-id="SourceLine-${lineNumber}"]`);
  const button = lineLocator.locator('[data-test-name="ContinueToButton"]');
  const isEnabled = await button.isEnabled();

  await stopHovering();

  return isEnabled;
}

export async function isContinueToNextButtonEnabled(
  page: Page,
  lineNumber: number
): Promise<boolean> {
  return isContinueToButtonEnabled(page, { direction: "next", lineNumber });
}

export async function isContinueToPreviousButtonEnabled(
  page: Page,
  lineNumber: number
): Promise<boolean> {
  return isContinueToButtonEnabled(page, { direction: "previous", lineNumber });
}

export async function isLineCurrent(page: Page, lineNumber: number): Promise<boolean> {
  const lineLocator = page.locator(`[data-test-id="SourceLine-${lineNumber}"]`);
  const currentHighlight = lineLocator.locator('[data-test-name="CurrentLineHighlight"]');
  const isVisible = await currentHighlight.isVisible();
  return isVisible;
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

export async function removeBreakPoint(
  page: Page,
  options: {
    lineNumber: number;
    sourceId: string;
  }
) {
  const { lineNumber, sourceId } = options;

  await debugPrint(
    page,
    `Removing break point for source "${chalk.bold(sourceId)}" at line ${chalk.bold(lineNumber)}`,
    "removeBreakPoint"
  );

  await openSourceFile(page, sourceId);
  await goToLine(page, lineNumber);

  const lineLocator = getSourceLineLocator(page, sourceId, lineNumber);

  await hoverOverLine(page, { lineNumber });

  const toggle = lineLocator.locator('[data-test-name="BreakpointToggle"]');
  const state = await toggle.getAttribute("data-test-state");
  if (state === "on") {
    await toggle.click({ force: true });
  }

  await stopHovering(page);
}

export async function removeLogPoint(
  page: Page,
  options: {
    lineNumber: number;
    sourceId: string;
  }
) {
  const { lineNumber, sourceId } = options;

  await debugPrint(
    page,
    `Removing log point for source "${chalk.bold(sourceId)}" at line ${chalk.bold(lineNumber)}`,
    "removeLogPoint"
  );

  await openSourceFile(page, sourceId);
  await goToLine(page, lineNumber);

  const lineLocator = getSourceLineLocator(page, sourceId, lineNumber);

  await hoverOverLine(page, { lineNumber });

  const toggle = lineLocator.locator('[data-test-name="LogPointToggle"]');
  const state = await toggle.getAttribute("data-test-state");
  if (state === "on") {
    await toggle.click({ force: true });
  }

  await stopHovering(page);
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

export async function toggleLogPointBadge(
  page: Page,
  options: {
    badge?: Badge | null;
    lineNumber: number;
    sourceId: string;
  }
) {
  const { badge, lineNumber, sourceId } = options;

  await openSourceFile(page, sourceId);
  await goToLine(page, lineNumber);

  const pointPanelLocator = getPointPanelLocator(page, options.lineNumber);

  const targetBadgeState = badge || "default";
  const badgeLocator = pointPanelLocator.locator(`[data-test-name=BadgePickerButton]`);

  const isVisible = await badgeLocator.isVisible();
  if (!isVisible) {
    // Edge case for too-many-points
    return;
  }

  const badgeState = await badgeLocator.getAttribute("data-test-state");
  if (targetBadgeState !== badgeState) {
    await debugPrint(
      page,
      `Setting badge to "${chalk.bold(targetBadgeState)}"`,
      "toggleLogPointBadge"
    );

    await badgeLocator.click();

    const targetButton = pointPanelLocator.locator(
      `[data-test-name=BadgeButtonButton-${targetBadgeState}]`
    );
    await targetButton.click();
  }
}
