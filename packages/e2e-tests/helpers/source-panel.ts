import { Locator, Page, expect } from "@playwright/test";
import chalk from "chalk";

import { Badge } from "shared/client/types";

import { focus, hideTypeAheadSuggestions, typeLogPoint as typeLexical } from "./lexical";
import { findPoints, openPauseInformationPanel, removePoint } from "./pause-information-panel";
import { openSource } from "./source-explorer-panel";
import { clearTextArea, debugPrint, getByTestName, getCommandKey, waitFor } from "./utils";
import { openDevToolsTab } from ".";

export async function editBadge(
  page: Page,
  options: {
    badge: Badge | null;
    lineNumber: number;
  }
) {
  const { badge, lineNumber } = options;

  await debugPrint(
    page,
    `Setting log-point badge "${chalk.bold(badge || "default")}"`,
    "editBadge"
  );

  const line = await getSourceLine(page, lineNumber);
  const badgePicker = await line.locator('[data-test-name="BadgePickerPopout"]');
  const isBadgePickerOpen = await badgePicker.isVisible();
  if (!isBadgePickerOpen) {
    // HACK Work around Playwright "subtree intercepts pointer events" issue with Lexical
    await page.evaluate(lineNumber => {
      const button = document.querySelector(
        `[data-test-id="BadgeButtonButton-${lineNumber}"]`
      ) as HTMLButtonElement;
      button.click();
    }, lineNumber);
  }

  // HACK Work around Playwright "subtree intercepts pointer events" issue with Lexical
  await page.evaluate(
    ([lineNumber, badge]) => {
      const button = document.querySelector(
        `[data-test-id="BadgeButtonButton-${lineNumber}-${badge}"]`
      ) as HTMLButtonElement;
      button.click();
    },
    [lineNumber, badge]
  );
}

export async function editConditional(
  page: Page,
  options: {
    condition: string;
    lineNumber: number;
  }
) {
  await toggleConditional(page, {
    lineNumber: options.lineNumber,
    state: true,
  });

  const { condition, lineNumber } = options;
  await debugPrint(
    page,
    `Setting log-point condition to "${chalk.bold(condition)}"`,
    "addConditional"
  );

  await typeLexical(page, {
    shouldSubmit: false,
    sourceLineNumber: lineNumber,
    text: condition,
    type: "condition",
  });
}

export async function jumpToLogPointHit(
  page: Page,
  number: number,
  options: {
    lineNumber: number;
  }
) {
  const { lineNumber } = options;

  await debugPrint(
    page,
    `Jumping directly to hit "${chalk.bold(number)}" for line ${chalk.bold(lineNumber)}`,
    "jumpToLogPointHit"
  );

  await focus(page, '[data-test-name="LogPointCurrentStepInput"]');

  const input = page.locator('[data-test-name="LogPointCurrentStepInput"]');
  await input.press(`${getCommandKey()}+A`);
  await input.type(`${number}`);
  await input.press("Enter");
}

export async function scrollUntilLineIsVisible(page: Page, lineNumber: number) {
  const lineLocator = await getSourceLine(page, lineNumber);

  // Don't rely on lineLocator.isVisible() because it can give false positives for partially visible rows

  await debugPrint(page, `Scrolling to source line ${chalk.bold(lineNumber)}`, "goToLine");

  await page.keyboard.down(getCommandKey());
  await page.keyboard.type("p");
  await page.keyboard.up(getCommandKey());

  const input = page.locator("[data-test-id=QuickOpenInput]");
  await input.focus();
  await clearTextArea(page, input);
  await page.keyboard.type(`:${lineNumber}`);
  await page.keyboard.press("Enter");

  await expect(lineLocator).toBeVisible();
}

async function getCurrentSource(page: Page): Promise<Locator | null> {
  const sources = page.locator("[data-test-name=Source]");

  for (let index = 0; index < (await sources.count()); index++) {
    const source = sources.nth(index);
    if (await source.isVisible()) {
      return source;
    }
  }

  return null;
}

export function getPointPanelLocator(page: Page, lineNumber: number): Locator {
  return page.locator(`[data-test-id=PointPanel-${lineNumber}]`);
}

export async function getVisibleLineNumbers(page: Page): Promise<number[]> {
  const source = await getCurrentSource(page);
  if (source === null) {
    return [];
  }

  const visibleLines: number[] = [];

  const lineNumbersLocator = source.locator('[data-test-name="SourceLine-LineNumber"]');
  for (let index = 0; index < (await lineNumbersLocator.count()); index++) {
    const lineNumberLocator = lineNumbersLocator.nth(index);
    if (await lineNumberLocator.isVisible()) {
      const textContent = await lineNumberLocator.evaluate(
        element => element.firstChild!.textContent
      );
      visibleLines.push(parseInt(textContent!));
    }
  }

  return visibleLines;
}

export async function addLogpoint(
  page: Page,
  options: {
    lineNumber: number;
    condition?: string;
    content?: string;
    url?: string;
    saveAfterEdit?: boolean;
    waitForSourceOutline?: boolean;
  }
): Promise<void> {
  const { lineNumber, url, waitForSourceOutline } = options;

  await debugPrint(
    page,
    `Adding log-point at ${chalk.bold(`${url}:${lineNumber}`)}`,
    "addLogpoint"
  );

  await openDevToolsTab(page);

  if (url) {
    await openSource(page, url);
  }
  if (waitForSourceOutline) {
    await page.locator(".outline-list").waitFor();
  }

  await scrollUntilLineIsVisible(page, lineNumber);
  await waitForSourceLineHitCounts(page, lineNumber);

  const line = await getSourceLine(page, lineNumber);
  const hitCountLocator = line.locator(`[data-test-name="SourceLine-HitCount"]`);
  await hitCountLocator.waitFor();
  await hitCountLocator.hover({ force: true });
  const toggle = line.locator('[data-test-name="LogPointToggle"]');
  await toggle.waitFor();
  const state = await toggle.getAttribute("data-test-state");
  if (state !== "on") {
    await toggle.click({ force: true });
  }

  const saveAfterEdit =
    options.saveAfterEdit !== undefined
      ? options.saveAfterEdit
      : options.condition !== undefined || options.content !== undefined;

  await waitForLogpoint(page, options);
  await editLogPoint(page, { ...options, saveAfterEdit });
}

export async function closeSource(page: Page, url: string): Promise<void> {
  await debugPrint(page, `Closing source "${chalk.bold(url)}"`, "closeSource");

  const sourceTab = getSourceTab(page, url);

  if (await sourceTab.isVisible()) {
    await sourceTab.hover();
    await sourceTab.locator("button").click();
  }

  await sourceTab.waitFor({ state: "detached" });
}

export async function editLogPoint(
  page: Page,
  options: {
    badge?: Badge | null;
    content?: string;
    condition?: string;
    lineNumber: number;
    saveAfterEdit: boolean;
    url?: string;
  }
) {
  const { badge, condition, content, lineNumber, saveAfterEdit, url } = options;

  await debugPrint(
    page,
    url
      ? `Editing log-point at ${chalk.bold(`${url}:${lineNumber}`)}`
      : `Editing log-point at ${chalk.bold(`${lineNumber}`)}`,
    "editLogPoint"
  );

  const line = await getSourceLine(page, lineNumber);

  if (badge !== undefined) {
    await editBadge(page, { badge, lineNumber });
  }

  if (condition != null) {
    await editConditional(page, { condition, lineNumber });
  }

  if (content != null) {
    const isEditing = await line
      .locator('[data-test-name="PointPanel-ContentWrapper"] [data-lexical-editor="true"]')
      .isVisible();
    if (!isEditing) {
      await line.locator('[data-test-name="PointPanel-IconAndAvatar"]').hover();
      await line.locator('[data-test-name="PointPanel-EditButton"]').click();
    }

    await debugPrint(page, `Setting log-point content "${chalk.bold(content)}"`, "addLogpoint");

    await typeLexical(page, {
      sourceLineNumber: lineNumber,
      shouldSubmit: false,
      text: content,
      type: "content",
    });
  }

  if (saveAfterEdit) {
    // The typeahead popup sometimes sticks around and overlaps the save button.
    // Sometimes, it will show up after we check the first time (PRO-238) so we
    // retry a couple times to ensure that we can clear it and move forward.
    await waitFor(async () => {
      await hideTypeAheadSuggestions(page, {
        sourceLineNumber: lineNumber,
        type: "log-point-condition",
      });
      await hideTypeAheadSuggestions(page, {
        sourceLineNumber: lineNumber,
        type: "log-point-content",
      });

      const saveButton = line.locator('[data-test-name="PointPanel-SaveButton"]');
      await expect(saveButton).toBeEnabled();
      await saveButton.click({ timeout: 1_000 });
      await saveButton.waitFor({ state: "detached" });
    });
  }
}

export function getLogPointPanelConditionTypeAhead(page: Page): Locator {
  return page.locator('[data-test-name="PointPanel-ConditionInput-CodeTypeAhead"]');
}

export function getLogPointPanelContentTypeAhead(page: Page): Locator {
  return page.locator('[data-test-name="PointPanel-ContentInput-CodeTypeAhead"]');
}

export async function verifyLogPointContentTypeAheadSuggestions(
  page: Page,
  expectedSuggestionsPartial: string[],
  unexpectedSuggestionsPartial: string[] = []
) {
  const typeAhead = getLogPointPanelContentTypeAhead(page);

  for (let index = 0; index < expectedSuggestionsPartial.length; index++) {
    const suggestion = expectedSuggestionsPartial[index];

    await debugPrint(
      page,
      `Verifying log-point content type-ahead contains suggestion "${chalk.bold(suggestion)}"`,
      "verifyLogPointContentTypeAheadSuggestions"
    );

    await waitFor(async () => {
      const results = typeAhead.locator(
        `[data-test-name="PointPanel-ContentInput-CodeTypeAhead-Item"]`
      );
      const allTextContents = await results.allTextContents();
      return expect(allTextContents).toContain(suggestion);
    });
  }

  for (let index = 0; index < unexpectedSuggestionsPartial.length; index++) {
    const suggestion = unexpectedSuggestionsPartial[index];

    await debugPrint(
      page,
      `Verifying log-point content type-ahead does not contain suggestion "${chalk.bold(
        suggestion
      )}"`,
      "verifyLogPointContentTypeAheadSuggestions"
    );

    await waitFor(async () => {
      const results = typeAhead.locator(
        `[data-test-name="PointPanel-ContentInput-CodeTypeAhead-Item"]`
      );
      const allTextContents = await results.allTextContents();
      return expect(allTextContents).not.toContain(suggestion);
    });
  }
}

export async function getSelectedLineNumber(
  page: Page,
  lineIsCurrentPoint: boolean
): Promise<number | null> {
  const highlightLineTestName = lineIsCurrentPoint
    ? "CurrentExecutionPointLineHighlight"
    : "ViewSourceHighlight";

  const sourceLocator = await getCurrentSource(page);
  if (sourceLocator == null) {
    return null;
  }

  const lineLocator = sourceLocator.locator(`[data-test-id^=SourceLine]`, {
    has: getByTestName(page, highlightLineTestName),
  });

  const count = await lineLocator.count();

  if (count === 0) {
    return null;
  }

  const lineNumberLocator = getByTestName(lineLocator, "SourceLine-LineNumber");
  const textContent = await lineNumberLocator.textContent();

  if (textContent === null) {
    return null;
  }

  return parseInt(textContent, 10);
}

export async function verifyJumpToCodeResults(
  page: Page,
  filename: string,
  lineNumber: number,
  expectedHits?: { current: number; total: number }
) {
  await waitForSelectedSource(page, filename);
  // Should highlight the line that ran
  await waitFor(async () => {
    const lineNumber = await getSelectedLineNumber(page, true);
    expect(lineNumber).toBe(lineNumber);
  });

  if (expectedHits) {
    // Should also have jumped in time. Since this can vary (slightly different progress %
    // based on timing differences), we'll add a log statement and verify _which_ hit we're at.
    await addLogpoint(page, {
      url: filename,
      lineNumber,
    });

    const { current, total } = expectedHits;

    // Should have paused on the handler for the first valid keystroke
    await verifyLogpointStep(page, `${current}/${total}`, { url: filename, lineNumber });
    await removeLogPoint(page, { url: filename, lineNumber });
  }
}

export function getSourceLocator(page: Page, sourceId: string): Locator {
  return page.locator(getSourceSelector(sourceId));
}

export async function getSourceLine(page: Page, lineNumber: number): Promise<Locator> {
  const sourceLocator = await getCurrentSource(page);
  return sourceLocator!.locator(getSourceLineSelector(lineNumber));
}

export function getSourceSelector(sourceId: string): string {
  return `[data-test-id="Source-${sourceId}"]`;
}

export function getSourceLineSelector(lineNumber: number): string {
  return `[data-test-id=SourceLine-${lineNumber}]`;
}

export function getSourceTab(page: Page, url: string): Locator {
  return page.locator(`[data-test-name="Source-${url}"]`);
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

export async function removeAllLogpoints(page: Page): Promise<void> {
  await debugPrint(page, `Removing all logpoints for the current source`, "removeAllLogpoints");

  await openPauseInformationPanel(page);
  const points = await findPoints(page, "logpoint");
  const count = await points.count();
  for (let index = count - 1; index >= 0; index--) {
    const point = points.nth(index);
    await removePoint(point);
  }
}

export async function removeConditional(
  page: Page,
  options: {
    lineNumber: number;
  }
) {
  await toggleConditional(page, {
    lineNumber: options.lineNumber,
    state: false,
  });
}

export async function removeLogPoint(
  page: Page,
  options: {
    lineNumber: number;
    url: string;
  }
): Promise<void> {
  const { lineNumber, url } = options;

  await debugPrint(
    page,
    `Removing log-point at ${chalk.bold(`${url}:${lineNumber}`)}`,
    "removeLogpoint"
  );

  await openDevToolsTab(page);
  await openSource(page, url);

  const line = await getSourceLine(page, lineNumber);
  const hitCountLocator = line.locator(`[data-test-name="SourceLine-HitCount"]`);
  await hitCountLocator.waitFor();
  await hitCountLocator.hover({ force: true });
  const toggle = line.locator('[data-test-name="LogPointToggle"]');
  await toggle.waitFor();
  const state = await toggle.getAttribute("data-test-state");
  if (state !== "off") {
    await toggle.click({ force: true });
  }
}

export async function toggleConditional(
  page: Page,
  options: {
    lineNumber: number;
    state: boolean;
  }
) {
  const { lineNumber, state: targetState } = options;

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
      "toggleConditional"
    );

    await contextMenuItem.click();
  }
}

export async function toggleShouldLog(
  page: Page,
  options: {
    lineNumber: number;
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

export async function seekToPreviousLogPointHit(page: Page, lineNumber: number) {
  await debugPrint(
    page,
    `Seeking to previous log-point hit at line ${chalk.bold(`${lineNumber}`)}`,
    "removeLogpoint"
  );

  const line = await getSourceLine(page, lineNumber);
  const previousButton = line.locator('[data-test-name="PreviousHitPointButton"]');
  await previousButton.waitFor();
  await previousButton.click();
}

export async function toggleMappedSources(page: Page, targetState: "on" | "off"): Promise<void> {
  const toggle = page.locator('[data-test-id="SourceMapToggle"]');
  const currentState = await toggle.getAttribute("data-test-state");
  if (currentState !== targetState) {
    await toggle.click();
  }
}

export async function waitForLogpoint(
  page: Page,
  options: {
    columnIndex?: number;
    lineNumber: number;
    url?: string;
  }
): Promise<void> {
  const { lineNumber, url } = options;

  await debugPrint(
    page,
    url
      ? `Waiting for log-point at ${chalk.bold(`${url}:${lineNumber}`)}`
      : `Waiting for log-point at ${chalk.bold(`${lineNumber}`)}`,
    "waitForLogpoint"
  );

  await openDevToolsTab(page);

  if (url) {
    await openSource(page, url);
  }

  const pointPanel = getPointPanelLocator(page, lineNumber);
  await pointPanel.waitFor();
}

export async function verifyLogpointStep(
  page: Page,
  expectedStatus: string,
  options: {
    lineNumber: number;
    url?: string;
  }
): Promise<void> {
  const { lineNumber, url } = options;

  if (url) {
    await openSource(page, url);
  }

  await debugPrint(
    page,
    `Verifying logpoint status "${chalk.bold(expectedStatus)}" for line ${chalk.bold(
      options.lineNumber
    )}`,
    "verifyLogpointStep"
  );

  const lineLocator = await getSourceLine(page, lineNumber);

  await waitFor(async () => {
    const currentStepInputLocator = lineLocator.locator(
      '[data-test-name="LogPointCurrentStepInput"]'
    );
    const currentStep = await currentStepInputLocator.getAttribute("data-value");
    const denominatorLocator = lineLocator.locator('[data-test-name="LogPointDenominator"]');
    const denominator = await denominatorLocator.textContent();

    const actualStatus = `${currentStep}/${denominator}`;

    expect(actualStatus).toBe(expectedStatus);
  });
}
export async function verifyLogPointPanelContent(
  page: Page,
  options: {
    badge?: Badge | null;
    content?: string;
    condition?: string;
    errorMessage?: string;
    hitPointsBadge?: string;
    lineNumber: number;
    url?: string;
  }
) {
  const { badge, condition, content, errorMessage, hitPointsBadge, lineNumber, url } = options;

  await debugPrint(
    page,
    url
      ? `Verifying (pending) log-point at ${chalk.bold(`${url}:${lineNumber}`)}`
      : `Verifying (pending) log-point at ${chalk.bold(`${lineNumber}`)}`,
    "verifyLogPoint"
  );

  const line = await getSourceLine(page, lineNumber);

  await waitFor(async () => {
    if (badge !== undefined) {
      const button = await line.locator('[data-test-name="BadgePickerButton"]');
      await expect(await button.getAttribute("data-test-state")).toBe(
        badge === null ? "default" : badge
      );
    }

    if (condition != null) {
      const input = await line.locator('[data-test-name="PointPanel-ConditionalWrapper"]');
      await expect(await input.textContent()).toBe(condition);
    }

    if (content != null) {
      const input = await line.locator('[data-test-name="PointPanel-ContentWrapper"]');
      await expect(await input.textContent()).toBe(content);
    }

    if (errorMessage != null) {
      const element = await line.locator('[data-test-name="PointPanel-ErrorMessage"]');
      await expect(await element.textContent()).toBe(errorMessage);
    }

    if (hitPointsBadge != null) {
      const input = line.locator('[data-test-name="LogPointCurrentStepInput"]');
      const inputValue = await input.getAttribute("data-value");
      const capsule = await line.locator('[data-test-name="LogPointDenominator"]');
      const capsuleText = await capsule.textContent();
      await expect(`${inputValue}/${capsuleText}`).toBe(hitPointsBadge);
    }
  });
}

export async function waitForSourceLineHitCounts(page: Page, lineNumber: number) {
  const lineLocator = await getSourceLine(page, lineNumber);
  await lineLocator.isVisible();

  await waitFor(async () => {
    const haveHitCountsLoaded = (await lineLocator.getAttribute("data-test-line-has-hits")) != null;
    if (!haveHitCountsLoaded) {
      throw Error(`Waiting for line ${lineNumber} to have hit counts loaded`);
    }
  });
}

// TODO [FE-626] Rewrite this helper to reduce complexity.
export async function waitForSelectedSource(page: Page, url: string) {
  await waitFor(async () => {
    const editorPanel = page.locator("#toolbox-content-debugger");
    const sourceHeader = editorPanel.locator(`[data-test-name="Source-${url}"]`);

    await expect(await sourceHeader.getAttribute("data-status")).toBe("active");

    // Make sure the visible source is the same source as the selected tab.
    const headerSourceId = await sourceHeader.getAttribute("data-test-source-id");
    expect(
      await page.locator('[data-test-name="Source"]:visible').getAttribute("data-test-source-id")
    ).toBe(headerSourceId);

    // Only succeed when we see formatted lines.
    const lines = editorPanel.locator(`[data-test-formatted-source="true"]`);
    const numLines = await lines.count();
    expect(numLines, { message: "Timed out waiting for source contents" }).toBeGreaterThan(0);
  });
}

export async function rewindToLine(
  page: Page,
  options: {
    lineNumber: number;
  }
): Promise<void> {
  const { lineNumber } = options;

  await scrollUntilLineIsVisible(page, lineNumber);
  await waitForSourceLineHitCounts(page, lineNumber);

  await debugPrint(page, `Rewinding to line ${chalk.bold(lineNumber)}`, "rewindToLine");

  const lineLocator = await getSourceLine(page, lineNumber);
  const buttonLocator = lineLocator.locator('[data-test-name="ContinueToButton"]');

  // Account for the fact that SourceListRow doesn't render SourceListRowMouseEvents while scrolling
  await waitFor(async () => {
    const isScrolling = await lineLocator.getAttribute("data-test-is-scrolling");
    expect(isScrolling).toBe(null);
  });

  await lineLocator.locator('[data-test-name="SourceLine-HitCount"]').hover({ force: true });
  await page.keyboard.down("Shift");
  await page.keyboard.down(getCommandKey());

  await expect(await buttonLocator.getAttribute("data-test-state")).toBe("previous");

  await buttonLocator.click({ force: true });

  await page.keyboard.up(getCommandKey());
  await page.keyboard.up("Shift");
}

export async function fastForwardToLine(
  page: Page,
  options: {
    lineNumber: number;
  }
): Promise<void> {
  const { lineNumber } = options;

  await scrollUntilLineIsVisible(page, lineNumber);
  await waitForSourceLineHitCounts(page, lineNumber);

  await debugPrint(page, `Fast forwarding to line ${chalk.bold(lineNumber)}`, "fastForwardToLine");

  const lineLocator = await getSourceLine(page, lineNumber);
  const buttonLocator = lineLocator.locator('[data-test-name="ContinueToButton"]');

  // Account for the fact that SourceListRow doesn't render SourceListRowMouseEvents while scrolling
  await waitFor(async () => {
    const isScrolling = await lineLocator.getAttribute("data-test-is-scrolling");
    expect(isScrolling).toBe(null);
  });

  await lineLocator.locator('[data-test-name="SourceLine-HitCount"]').hover({ force: true });
  await page.keyboard.down(getCommandKey());

  await expect(await buttonLocator.getAttribute("data-test-state")).toBe("next");

  await buttonLocator.click({ force: true });

  await page.keyboard.up(getCommandKey());
}

export async function waitForSourceContentsToFinishStreaming(
  page: Page,
  options: {
    sourceId: string;
  }
): Promise<void> {
  const { sourceId } = options;

  await debugPrint(page, `Waiting on streaming content for source "${sourceId}"`, "quickOpen");
  await page.waitForSelector(`[data-test-id="Source-${sourceId}"]`);
  await waitFor(
    async () => {
      const sourceLocator = page.locator(`[data-test-id="Source-${sourceId}"]`);
      const status = await sourceLocator.getAttribute("data-test-source-contents-status");
      expect(status).toBe("resolved");
    },
    { retryInterval: 1_000, timeout: 15_000 }
  );
}

async function getSourceId(page: Page, url: string) {
  const sourceTab = getSourceTab(page, url);
  return await sourceTab.getAttribute("data-test-source-id");
}

export async function waitForSourceToBeShown(page: Page, url: string) {
  const sourceId = await getSourceId(page, url);
  await page.waitForSelector(`[data-test-id="Source-${sourceId}"]`, { state: "visible" });
}
