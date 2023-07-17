import { Locator, Page, expect } from "@playwright/test";
import chalk from "chalk";

import {
  findContextMenuItem,
  hideContextMenu,
  showContextMenu,
} from "replay-next/playwright/tests/utils/context-menu";

import { getConsoleSearchInput } from "./console";
import {
  clearTextArea,
  debugPrint,
  delay,
  getCommandKey,
  stopHovering,
  typeCommandKey,
  waitFor,
} from "./general";

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
  await goToLine(page, sourceId, lineNumber);

  const lineLocator = getSourceLineLocator(page, sourceId, lineNumber);

  await hoverOverLine(page, { lineNumber, sourceId });

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
    saveAfterEdit?: boolean;
    sourceId: string;
  }
) {
  const { badge, condition, content, lineNumber, saveAfterEdit = true, sourceId } = options;

  await debugPrint(
    page,
    `Adding log point for source "${chalk.bold(sourceId)}" at line ${chalk.bold(lineNumber)}`,
    "addLogPoint"
  );

  await openSourceFile(page, sourceId);

  // Overscroll by a little bit to ensure there's enough room for the point panel.
  await goToLine(page, sourceId, lineNumber + 5);

  const lineLocator = getSourceLineLocator(page, sourceId, lineNumber);

  await hoverOverLine(page, { lineNumber, sourceId });

  const toggle = lineLocator.locator('[data-test-name="LogPointToggle"]');
  const state = await toggle.getAttribute("data-test-state");
  if (state === "off") {
    await toggle.click({ force: true });
  }

  if (condition !== undefined || content !== undefined || saveAfterEdit) {
    await editLogPoint(page, options);
  }

  await toggleLogPointBadge(page, { badge, lineNumber, sourceId });

  await stopHovering(page);
}

export async function clearSearchResult(page: Page) {
  await focusOnSource(page);

  await debugPrint(page, `${chalk.bold("Clearing")} search result`, "clearSearchResult");

  await page.click('[data-test-id="SourceSearchClearButton"]');
}

export async function continueTo(
  page: Page,
  options: {
    direction: "next" | "previous";
    lineNumber: number;
    sourceId: string;
    use: "hover-button" | "context-menu";
  }
) {
  const { direction, lineNumber, sourceId, use } = options;

  await debugPrint(
    page,
    sourceId == null
      ? `Continuing to ${chalk.bold(direction)} line ${chalk.bold(lineNumber)} via ${use}`
      : `Continuing to ${chalk.bold(direction)} line ${chalk.bold(
          lineNumber
        )} for source "${chalk.bold(sourceId)}" via ${use}`,
    "continueToNext"
  );

  if (sourceId != null) {
    await openSourceFile(page, sourceId);
  }
  await goToLine(page, sourceId, lineNumber);

  const lineLocator = page.locator(`[data-test-id="SourceLine-${lineNumber}"]`);

  switch (use) {
    case "context-menu": {
      await showContextMenu(page, lineLocator);
      const menuItem = await findContextMenuItem(
        page,
        direction === "next" ? "Fast forward" : "Rewind"
      );
      await menuItem.click();

      break;
    }
    case "hover-button": {
      const stopHovering = await hoverOverLine(page, {
        lineNumber,
        sourceId,
        withMetaKey: true,
        withShiftKey: direction === "previous",
      });

      const button = lineLocator.locator('[data-test-name="ContinueToButton"]');
      const state = await button.getAttribute("data-test-state");
      if (direction === state) {
        await button.click();
      }

      await stopHovering();
      break;
    }
  }
}

export async function editLogPoint(
  page: Page,
  options: {
    content?: string;
    condition?: string;
    lineNumber: number;
    saveAfterEdit?: boolean;
    sourceId: string;
  }
) {
  const { content, condition, lineNumber, saveAfterEdit = true, sourceId } = options;

  await debugPrint(
    page,
    `Editing log point for source "${chalk.bold(sourceId)}" at line ${chalk.bold(lineNumber)}`,
    "editLogPoint"
  );

  await openSourceFile(page, sourceId);
  await goToLine(page, sourceId, lineNumber);

  await hoverOverLine(page, { lineNumber, sourceId });

  const pointPanelLocator = getPointPanelLocator(page, options.lineNumber);
  const editButtonLocator = await pointPanelLocator.locator(
    "[data-test-name=PointPanel-EditButton]"
  );

  // Wait until the edit button is clickable (and we click it) or the log point is editable
  await waitFor(async () => {
    const editButtonIsVisible = await editButtonLocator.isVisible();
    if (editButtonIsVisible) {
      await editButtonLocator.click();
    }

    const contentLocator = pointPanelLocator.locator(`[data-test-name=PointPanel-ContentInput]`);
    const isVisible = await contentLocator.isVisible();
    expect(isVisible).toBe(true);
  });

  const contentLocator = pointPanelLocator.locator(`[data-test-name=PointPanel-ContentInput]`);
  if (content != null) {
    await debugPrint(page, `Setting log point content to "${chalk.bold(content)}"`, "editLogPoint");

    await clearTextArea(page, contentLocator);
    await contentLocator.fill(content);
  }

  if (condition != null) {
    await addConditional(page, { condition, lineNumber, sourceId });
  }

  if (saveAfterEdit) {
    await debugPrint(
      page,
      `Saving log point for source "${chalk.bold(sourceId)}" at line ${chalk.bold(lineNumber)}`,
      "editLogPoint"
    );

    const saveButton = pointPanelLocator.locator('[data-test-name="PointPanel-SaveButton"]');
    await saveButton.click({ force: true });

    // Give log point time to be processed.
    await delay();
  }
}

export async function addConditional(
  page: Page,
  options: {
    condition?: string;
    lineNumber: number;
    saveAfterAdding?: boolean;
    sourceId: string;
  }
) {
  await toggleConditional(page, { ...options, state: true });

  const { condition, lineNumber, saveAfterAdding } = options;
  if (condition != null) {
    await debugPrint(
      page,
      `Setting log point condition to "${chalk.bold(condition)}"`,
      "addConditional"
    );

    const pointPanelLocator = getPointPanelLocator(page, lineNumber);
    const conditionLocator = pointPanelLocator.locator(
      `[data-test-name=PointPanel-ConditionInput]`
    );
    await clearTextArea(page, conditionLocator);
    await conditionLocator.fill(condition);

    // Give time for the type-ahead to be evaluated and hide if it needed
    await delay();

    const typeAheadLocator = getLogPointPanelConditionTypeAhead(page);
    if (await typeAheadLocator.isVisible()) {
      await page.keyboard.press("Escape");
      await expect(await typeAheadLocator).not.toBeVisible();
    }

    if (saveAfterAdding) {
      await page.keyboard.press("Enter");
    }
  }
}

export async function focusOnSource(page: Page) {
  await debugPrint(page, "(Re)focus on Source root", "focusOnSource");

  // wait for the console search input - it has an "autoFocus" attribute which
  // means it will "steal" the focus when it is first displayed, so we should
  // wait for that before focusing on anything else
  await getConsoleSearchInput(page).waitFor();

  const sourcesRoot = page.locator('[data-test-id="SourcesRoot"]');
  await expect(sourcesRoot).toBeVisible();
  await sourcesRoot.focus();
  await expect(sourcesRoot).toBeFocused();
}

export function getLogPointPanelConditionTypeAhead(page: Page): Locator {
  return page.locator('[data-test-name="PointPanel-ConditionInput-CodeTypeAhead"]');
}

export function getLogPointPanelContentTypeAhead(page: Page): Locator {
  return page.locator('[data-test-name="PointPanel-ContentInput-CodeTypeAhead"]');
}

function getNextHitPointButton(page: Page, lineNumber: number): Locator {
  const pointPanelLocator = getPointPanelLocator(page, lineNumber);
  return pointPanelLocator.locator(`[data-test-name="NextHitPointButton"]`);
}

function getPreviousHitPointButton(page: Page, lineNumber: number): Locator {
  const pointPanelLocator = getPointPanelLocator(page, lineNumber);
  return pointPanelLocator.locator(`[data-test-name="PreviousHitPointButton"]`);
}

export function getPointPanelLocator(page: Page, lineNumber: number): Locator {
  return page.locator(`[data-test-id=PointPanel-${lineNumber}]`);
}

export function getPointPanelConditionAutoCompleteListLocator(
  page: Page,
  lineNumber: number
): Locator {
  return page.locator(`[data-test-id="PointPanel-ConditionInput-${lineNumber}-CodeTypeAhead"]`);
}

export function getPointPanelContentAutoCompleteListLocator(
  page: Page,
  lineNumber: number
): Locator {
  return page.locator(`[data-test-id="PointPanel-ContentInput-${lineNumber}-CodeTypeAhead"]`);
}

export function getSourceSearchResultsLabelLocator(page: Page): Locator {
  return page.locator(`[data-test-id="SearchResultsLabel"]`);
}

export function getSourceFileNameSearchResultsLocator(page: Page): Locator {
  return page.locator(`[data-test-id="SourceFileNameSearchResults"]`);
}

export function getSourceLineContentsLocator(
  page: Page,
  sourceId: string,
  lineNumber: number
): Locator {
  const lineLocator = getSourceLineLocator(page, sourceId, 20);
  return lineLocator.locator('[data-test-name="SourceLine-Contents"]');
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

export async function goToLine(page: Page, sourceId: string, lineNumber: number) {
  const lineLocator = getSourceLineLocator(page, sourceId, lineNumber);
  const lineIsVisible = await lineLocator.isVisible();
  if (lineIsVisible) {
    return;
  }

  await debugPrint(page, `Going to source line ${chalk.bold(lineNumber)}`, "goToLine");

  await focusOnSource(page);

  await typeCommandKey(page, "o");

  const input = page.locator('[data-test-id="SourceFileNameSearchInput"]');
  await expect(input).toBeFocused();

  await clearTextArea(page, input);
  await page.keyboard.type(`:${lineNumber}`);
  await page.keyboard.press("Enter");

  await expect(lineLocator).toBeVisible();
}

export async function goToLogPointTimelineTime(page: Page, lineNumber: number, percentage: number) {
  if (percentage < 0 || percentage > 1) {
    throw Error(`Invalid percentage ${percentage} (must be between 0-1)`);
  }

  const pointPanelLocator = getPointPanelLocator(page, lineNumber);
  const timelineLocator = pointPanelLocator.locator(`[data-test-name="PointPanelTimeline"]`);

  const isVisible = await timelineLocator.isVisible();
  if (!isVisible) {
    throw Error(`No log point found for line ${lineNumber}`);
  }

  await debugPrint(
    page,
    `Seek to ${chalk.bold(percentage)}% using point panel on line ${chalk.bold(lineNumber)}`,
    "goToLogPointTimelineTime"
  );

  const height = await timelineLocator.evaluate(element => element.getBoundingClientRect().height);
  const width = await timelineLocator.evaluate(element => element.getBoundingClientRect().width);
  const x = width * percentage;
  const y = height / 2;

  await timelineLocator.hover({ force: true, position: { x, y } });
  await delay(1000);
  await timelineLocator.click({ force: true, position: { x, y } });
  await delay(1000);

  await waitForTimelineToUpdate(timelineLocator);
}

export async function goToNextHitPoint(page: Page, lineNumber: number) {
  const buttonLocator = getNextHitPointButton(page, lineNumber);

  const isVisible = await buttonLocator.isVisible();
  if (!isVisible) {
    throw Error(`No log point found for line ${lineNumber}`);
  }

  const isEnabled = await buttonLocator.isEnabled();
  if (!isEnabled) {
    throw Error(`Next hit point button is disabled for line ${lineNumber}`);
  }

  await debugPrint(
    page,
    `Going to next hit point for line ${chalk.bold(lineNumber)}`,
    "goToLogPointTimelineTime"
  );

  await buttonLocator.click({ force: true });

  const pointPanelLocator = getPointPanelLocator(page, lineNumber);
  const timelineLocator = pointPanelLocator.locator(`[data-test-name="PointPanelTimeline"]`);
  await waitForTimelineToUpdate(timelineLocator);
}

export async function goToNextSourceSearchResult(page: Page) {
  await focusOnSource(page);

  await debugPrint(
    page,
    `Going to ${chalk.bold("next")} search result`,
    "goToNextSourceSearchResult"
  );

  await page.click('[data-test-id="SourceSearchGoToNextButton"]');
}

export async function goToPreviousHitPoint(page: Page, lineNumber: number) {
  const buttonLocator = getPreviousHitPointButton(page, lineNumber);

  const isVisible = await buttonLocator.isVisible();
  if (!isVisible) {
    throw Error(`No log point found for line ${lineNumber}`);
  }

  const isEnabled = await buttonLocator.isEnabled();
  if (!isEnabled) {
    throw Error(`Previous hit point button is disabled for line ${lineNumber}`);
  }

  await debugPrint(
    page,
    `Going to previous hit point for line ${chalk.bold(lineNumber)}`,
    "goToLogPointTimelineTime"
  );

  await buttonLocator.click({ force: true });

  const pointPanelLocator = getPointPanelLocator(page, lineNumber);
  const timelineLocator = pointPanelLocator.locator(`[data-test-name="PointPanelTimeline"]`);
  await waitForTimelineToUpdate(timelineLocator);
}

export async function goToPreviousSourceSearchResult(page: Page) {
  await focusOnSource(page);

  await debugPrint(
    page,
    `Going to ${chalk.bold("previous")} search result`,
    "goToNextSourceSearchResult"
  );

  await page.click('[data-test-id="SourceSearchGoToPreviousButton"]');
}

export async function hoverOverLine(
  page: Page,
  options: {
    lineNumber: number;
    sourceId: string;
    withMetaKey?: boolean;
    withShiftKey?: boolean;
  }
): Promise<AsyncFunction> {
  const { lineNumber, sourceId, withMetaKey, withShiftKey } = options;

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

  await debugPrint(
    page,
    `Start hovering over source "${chalk.bold(sourceId)}" line ${chalk.bold(lineNumber)} ${suffix}`,
    "hoverOverLine"
  );

  await goToLine(page, sourceId, lineNumber);

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
    await debugPrint(
      page,
      `Stop hovering over source "${chalk.bold(sourceId)}" line ${chalk.bold(
        lineNumber
      )} ${suffix}`,
      "hoverOverLine"
    );

    await stopHovering(page);
    if (withMetaKey) {
      await page.keyboard.up(getCommandKey());
    }
    if (withShiftKey) {
      await page.keyboard.up("Shift");
    }
  };
}

export async function isSeekOptionEnabled(
  page: Page,
  options: {
    direction: "previous" | "next";
    lineNumber: number;
    sourceId: string;
  }
): Promise<boolean> {
  const { direction, lineNumber, sourceId } = options;

  await debugPrint(
    page,
    `Is continue to ${chalk.bold(direction)} enabled for line ${chalk.bold(lineNumber)}?`,
    "isContinueToButtonEnabled"
  );

  const lineLocator = page.locator(`[data-test-id="SourceLine-${lineNumber}"]`);

  const stopHovering = await hoverOverLine(page, {
    lineNumber,
    sourceId,
    withMetaKey: true,
    withShiftKey: direction === "previous",
  });

  const button = lineLocator.locator('[data-test-name="ContinueToButton"]');
  const isHoverButtonEnabled = await button.isEnabled();

  await stopHovering();

  await showContextMenu(page, lineLocator);
  const menuItem = await findContextMenuItem(
    page,
    direction === "next" ? "Fast forward" : "Rewind"
  );
  const isContextMenuItemEnabled = await menuItem.isEnabled();

  await hideContextMenu(page);

  return isContextMenuItemEnabled && isHoverButtonEnabled;
}

export async function isContinueToNextOptionEnabled(
  page: Page,
  sourceId: string,
  lineNumber: number
): Promise<boolean> {
  return isSeekOptionEnabled(page, { direction: "next", lineNumber, sourceId });
}

export async function isContinueToPreviousOptionEnabled(
  page: Page,
  sourceId: string,
  lineNumber: number
): Promise<boolean> {
  return isSeekOptionEnabled(page, { direction: "previous", lineNumber, sourceId });
}

export async function isLineCurrentSearchResult(page: Page, lineNumber: number): Promise<boolean> {
  const lineLocator = page.locator(`[data-test-id="SourceLine-${lineNumber}"]`);
  const currentHighlight = lineLocator.locator('[data-test-name="CurrentSearchResultHighlight"]');
  const isVisible = await currentHighlight.isVisible();
  return isVisible;
}

export async function openLogPointPanelContextMenu(
  page: Page,
  options: {
    lineNumber: number;
  }
) {
  const { lineNumber } = options;

  const contextMenu = page.locator(`[data-test-id="LogPointContextMenu-Line-${lineNumber}"]`);
  const isVisible = await contextMenu.isVisible();
  if (!isVisible) {
    await debugPrint(page, `Opening log point panel context menu`, "openLogPointPanelContextMenu");

    const pointPanelLocator = getPointPanelLocator(page, lineNumber);
    const capsule = pointPanelLocator.locator('[data-test-name="LogPointCapsule-DropDownTrigger"]');
    await capsule.click();

    await contextMenu.waitFor();
  }
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
  await goToLine(page, sourceId, lineNumber);

  const lineLocator = getSourceLineLocator(page, sourceId, lineNumber);

  await hoverOverLine(page, { lineNumber, sourceId });

  const toggle = lineLocator.locator('[data-test-name="BreakpointToggle"]');
  const state = await toggle.getAttribute("data-test-state");
  if (state === "on") {
    await toggle.click({ force: true });
  }

  await stopHovering(page);
}

export async function removeConditional(
  page: Page,
  options: {
    lineNumber: number;
    sourceId: string;
  }
) {
  await toggleConditional(page, { ...options, state: false });
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
  await goToLine(page, sourceId, lineNumber);

  const lineLocator = getSourceLineLocator(page, sourceId, lineNumber);

  await hoverOverLine(page, { lineNumber, sourceId });

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

  await typeCommandKey(page, "f");

  const input = page.locator('[data-test-id="SourceSearchInput"]');
  await expect(input).toBeFocused();

  await clearTextArea(page, input);
  await page.keyboard.type(text);

  // Give time for the search results to update if needed
  await delay();
}

export async function searchSourcesByName(page: Page, text: string) {
  await focusOnSource(page);

  await debugPrint(
    page,
    `Searching source files by name "${chalk.bold(text)}"`,
    "searchSourcesByName"
  );

  await typeCommandKey(page, "o");

  const input = page.locator('[data-test-id="SourceFileNameSearchInput"]');
  await expect(input).toBeFocused();

  await clearTextArea(page, input);
  await page.keyboard.type(text);
}

export async function toggleConditional(
  page: Page,
  options: {
    lineNumber: number;
    sourceId: string;
    state: boolean;
  }
) {
  const { lineNumber, sourceId, state: targetState } = options;

  await openSourceFile(page, sourceId);
  await goToLine(page, sourceId, lineNumber);

  await openLogPointPanelContextMenu(page, { lineNumber });

  const contextMenu = page.locator(`[data-test-id="LogPointContextMenu-Line-${lineNumber}"]`);
  const contextMenuItem = contextMenu.locator(
    '[data-test-name="ContextMenuItem-ToggleConditional"]'
  );
  await contextMenuItem.waitFor();
  const actualState = (await contextMenuItem.getAttribute("data-test-state")) === "true";
  if (actualState !== targetState) {
    await debugPrint(
      page,
      targetState
        ? `Removing conditional from line ${lineNumber}`
        : `Adding conditional to line ${lineNumber}`,
      "removeConditional"
    );

    await contextMenuItem.click();
  }
}

export async function toggleColumnBreakpoint(
  page: Page,
  enabled: boolean,
  options: {
    columnIndex: number;
    lineNumber: number;
    sourceId: string;
  }
) {
  const { columnIndex, lineNumber, sourceId } = options;

  await debugPrint(
    page,
    `Toggling breakpoint ${
      enabled ? "on" : "off"
    } for line ${lineNumber} and column index ${columnIndex}`,
    "toggleColumnBreakpoint"
  );

  const lineLocator = getSourceLineLocator(page, sourceId, lineNumber);
  const toggle = lineLocator.locator(
    `[data-test-id="ColumnBreakpointMarker-${sourceId}:${lineNumber}:${columnIndex}"]`
  );
  const targetState = enabled ? "enabled" : "disabled";
  const currentState = await toggle.getAttribute("data-test-state");
  if (currentState !== targetState) {
    await toggle.click();
  }
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
  await goToLine(page, sourceId, lineNumber);

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

  await stopHovering(page);
}

export async function toggleShouldLog(
  page: Page,
  options: {
    lineNumber: number;
    sourceId: string;
    state: boolean;
  }
) {
  const { lineNumber, state: targetState } = options;

  await openLogPointPanelContextMenu(page, { lineNumber });

  const contextMenu = page.locator(`[data-test-id="LogPointContextMenu-Line-${lineNumber}"]`);
  const contextMenuItem = contextMenu.locator('[data-test-name="ContextMenuItem-ToggleEnabled"]');
  await contextMenuItem.waitFor();
  const actualState = (await contextMenuItem.getAttribute("data-test-state")) === "true";
  if (actualState !== targetState) {
    await debugPrint(
      page,
      targetState
        ? `Disable logging for line ${lineNumber}`
        : `Enable logging for line ${lineNumber}`,
      "toggleShouldLog"
    );

    await contextMenuItem.click();
  }
}

export async function verifyCurrentExecutionPoint(
  page: Page,
  fileName: string,
  lineNumber: number,
  expected: boolean = true
) {
  const selectedSourceTab = page.locator(
    `[data-test-id^="SourceTab-"][data-test-state="selected"]`
  );
  await expect(await selectedSourceTab.textContent()).toBe(fileName);

  await waitFor(async () => {
    const lineLocator = page.locator(`[data-test-id="SourceLine-${lineNumber}"]`);
    const currentHighlight = lineLocator.locator(
      '[data-test-name="CurrentExecutionPointLineHighlight"]'
    );
    const isVisible = await currentHighlight.isVisible();
    if (isVisible !== expected) {
      throw new Error(`Expected line ${lineNumber} to be the current execution point`);
    }
  });
}

export async function verifyCurrentSearchResult(
  page: Page,
  options: {
    fileName?: string;
    lineNumber: number;
    sourceId?: string;
  },
  expected: boolean = true
) {
  const { fileName, lineNumber, sourceId } = options;

  if (fileName != null) {
    const selectedSourceTab = page.locator(
      `[data-test-id^="SourceTab-"][data-test-state="selected"]`
    );
    await expect(await selectedSourceTab.textContent()).toBe(fileName);
  } else if (sourceId != null) {
    const selectedSourceTab = page.locator(
      `[data-test-id^="SourceTab-${sourceId}"][data-test-state="selected"]`
    );
    await expect(await selectedSourceTab.isVisible()).toBe(true);
  } else {
    throw `Must specify either a file name or source id`;
  }

  await waitFor(async () => {
    const lineLocator = page.locator(`[data-test-id="SourceLine-${lineNumber}"]`);
    const currentHighlight = lineLocator.locator('[data-test-name="CurrentSearchResultHighlight"]');
    const isVisible = await currentHighlight.isVisible();
    if (isVisible !== expected) {
      throw new Error(`Expected line ${lineNumber} to be the current search result`);
    }
  });
}

export async function verifyHitPointButtonsEnabled(
  page: Page,
  options: {
    nextEnabled?: boolean;
    lineNumber: number;
    previousEnabled?: boolean;
  }
): Promise<void> {
  const { lineNumber, nextEnabled, previousEnabled } = options;

  const expectedNextEnabled = nextEnabled !== false;
  const expectedPreviousEnabled = previousEnabled !== false;

  const previousButton = getPreviousHitPointButton(page, lineNumber);
  const nextButton = getNextHitPointButton(page, lineNumber);

  await debugPrint(
    page,
    `Verifying hit point previous button ${chalk.bold(
      expectedPreviousEnabled ? "enabled" : "disabled"
    )} and next button ${chalk.bold(
      expectedNextEnabled ? "enabled" : "disabled"
    )} for line ${chalk.bold(options.lineNumber)}`,
    "verifyHitPointButtonsEnabled"
  );

  await waitFor(async () => {
    const actualNextEnabled = await nextButton.isEnabled();
    const actualPreviousEnabled = await previousButton.isEnabled();

    const nextMatches = actualNextEnabled === expectedNextEnabled;
    const previousMatches = actualPreviousEnabled === expectedPreviousEnabled;

    if (!nextMatches && !previousMatches) {
      throw `Waiting for previous button to be ${
        expectedPreviousEnabled ? "enabled" : "disabled"
      } and next button to be ${expectedNextEnabled ? "enabled" : "disabled"}`;
    } else if (!nextMatches) {
      throw `Waiting for next button to be ${expectedNextEnabled ? "enabled" : "disabled"}`;
    } else if (!previousMatches) {
      throw `Waiting for previous button to be ${expectedPreviousEnabled ? "enabled" : "disabled"}`;
    }
  });
}

export async function verifyLogPointStep(
  page: Page,
  expectedStatus: string,
  options: {
    lineNumber: number;
    sourceId: string;
  }
): Promise<void> {
  const { lineNumber, sourceId } = options;

  await debugPrint(
    page,
    `Verifying log point status "${chalk.bold(expectedStatus)}" for line ${chalk.bold(
      options.lineNumber
    )}`,
    "verifyLogPointStep"
  );

  const lineLocator = getSourceLineLocator(page, sourceId, lineNumber);
  await waitFor(async () => {
    const currentStepInputLocator = lineLocator.locator(
      '[data-test-name="LogPointCurrentStepInput"]'
    );
    const currentStep = await currentStepInputLocator.inputValue();
    const denominatorLocator = lineLocator.locator('[data-test-name="LogPointDenominator"]');
    const denominator = await denominatorLocator.textContent();

    const actualStatus = `${currentStep}/${denominator}`;

    expect(actualStatus).toBe(expectedStatus);
  });
}

export async function waitForSourceLineHitCounts(page: Page, sourceId: string, lineNumber: number) {
  const lineLocator = getSourceLineLocator(page, sourceId, lineNumber);
  await lineLocator.isVisible();

  await waitFor(async () => {
    const hitCountsState = await lineLocator.getAttribute("data-test-hit-counts-state");
    if (hitCountsState !== "loaded") {
      throw Error(`Waiting for line ${lineNumber} to have hit counts loaded`);
    }
  });
}

export async function waitForSourceContentsToStream(page: Page, sourceId: string) {
  const sourceLocator = getSourceLocator(page, sourceId);
  await expect(sourceLocator).toBeVisible();

  await waitFor(async () => {
    const status = await sourceLocator.getAttribute("data-test-source-status");
    if (status !== "resolved") {
      throw Error(`Waiting for source to be "resolved" but is "${status}"`);
    }
  });
}

async function waitForTimelineToUpdate(timelineLocator: Locator) {
  // Give the click time to start processing.
  await delay(1000);

  // Wait for the time-to-execution-point mapping request to finish.
  await waitFor(async () => {
    const state = await timelineLocator.getAttribute("data-test-state");
    if (state !== "enabled") {
      throw "Timeline is not enabled";
    }
  });
}
