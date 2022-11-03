import { Locator, Page, expect } from "@playwright/test";
import chalk from "chalk";

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

  // Overscroll by a little bit to ensure there's enough room for the point panel.
  await goToLine(page, sourceId, lineNumber + 5);

  const lineLocator = getSourceLineLocator(page, sourceId, lineNumber);

  await hoverOverLine(page, { lineNumber, sourceId });

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
  await goToLine(page, sourceId, lineNumber);

  const lineLocator = page.locator(`[data-test-id="SourceLine-${lineNumber}"]`);

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
  await goToLine(page, sourceId, lineNumber);

  const pointPanelLocator = getPointPanelLocator(page, options.lineNumber);
  if (!(await pointPanelLocator.isVisible())) {
    await hoverOverLine(page, { lineNumber, sourceId });
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

export function getSourceSearchResultsLabelLocator(page: Page): Locator {
  return page.locator(`[data-test-id="SearchResultsLabel"]`);
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
  await debugPrint(page, `Hovering over line ${chalk.bold(lineNumber)} ${suffix}`, "hoverOverLine");

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
    sourceId: string;
  }
): Promise<boolean> {
  const { direction, lineNumber, sourceId } = options;

  const stopHovering = await hoverOverLine(page, {
    lineNumber,
    sourceId,
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
  sourceId: string,
  lineNumber: number
): Promise<boolean> {
  return isContinueToButtonEnabled(page, { direction: "next", lineNumber, sourceId });
}

export async function isContinueToPreviousButtonEnabled(
  page: Page,
  sourceId: string,
  lineNumber: number
): Promise<boolean> {
  return isContinueToButtonEnabled(page, { direction: "previous", lineNumber, sourceId });
}

export async function isLineCurrentExecutionPoint(
  page: Page,
  lineNumber: number
): Promise<boolean> {
  const lineLocator = page.locator(`[data-test-id="SourceLine-${lineNumber}"]`);
  const currentHighlight = lineLocator.locator(
    '[data-test-name="CurrentExecutionPointLineHighlight"]'
  );
  const isVisible = await currentHighlight.isVisible();
  return isVisible;
}

export async function isLineCurrentSearchResult(page: Page, lineNumber: number): Promise<boolean> {
  const lineLocator = page.locator(`[data-test-id="SourceLine-${lineNumber}"]`);
  const currentHighlight = lineLocator.locator('[data-test-name="CurrentSearchResultHighlight"]');
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

  await expect(getSourceLocator(page, sourceId)).toBeVisible();
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
  const statusLocator = lineLocator.locator('[data-test-name="LogPointStatus"]');

  const actualStatus = await statusLocator.textContent();

  expect(actualStatus).toBe(expectedStatus);
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
