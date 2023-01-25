import { Locator, Page, expect } from "@playwright/test";
import chalk from "chalk";

import { type as typeLexical } from "./lexical";
import { openPauseInformationPanel } from "./pause-information-panel";
import { openSource, openSourceExplorerPanel } from "./source-explorer-panel";
import { clearTextArea, debugPrint, delay, getCommandKey, mapLocators, waitFor } from "./utils";
import { openDevToolsTab } from ".";

export async function addBreakpoint(
  page: Page,
  options: {
    columnIndex?: number;
    lineNumber: number;
    url: string;
  }
): Promise<void> {
  const { lineNumber, url } = options;

  await debugPrint(
    page,
    `Adding breakpoint at ${chalk.bold(`${url}:${lineNumber}`)}`,
    "addBreakpoint"
  );

  await openDevToolsTab(page);

  if (url) {
    await openSourceExplorerPanel(page);
    await openSource(page, url);
  }

  await scrollUntilLineIsVisible(page, lineNumber);

  const line = await getSourceLine(page, lineNumber);
  await line.locator('[data-test-id^="SourceLine-LineNumber"]').hover();
  await line.locator('[data-test-name="BreakpointToggle"]').click();

  await waitForBreakpoint(page, options);
}

export async function addConditional(
  page: Page,
  options: {
    condition?: string;
    lineNumber: number;
  }
) {
  await toggleConditional(page, {
    lineNumber: options.lineNumber,
    state: true,
  });

  const { condition, lineNumber } = options;
  if (condition != null) {
    await debugPrint(
      page,
      `Setting log point condition to "${chalk.bold(condition)}"`,
      "addConditional"
    );

    await typeLexical(
      page,
      `${getSourceLineSelector(lineNumber)} [data-test-name="PointPanel-ConditionInput"]`,
      condition,
      false
    );
  }
}

async function scrollUntilLineIsVisible(page: Page, lineNumber: number) {
  const lineLocator = await getSourceLine(page, lineNumber);
  const lineIsVisible = await lineLocator.isVisible();
  if (lineIsVisible) {
    return;
  }

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

  const lineNumbersLocator = source.locator('[data-test-id^="SourceLine-LineNumber"]');
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
    url: string;
    saveAfterEdit?: boolean;
  }
): Promise<void> {
  const { lineNumber, url } = options;

  await debugPrint(
    page,
    `Adding log-point at ${chalk.bold(`${url}:${lineNumber}`)}`,
    "addLogpoint"
  );

  await openDevToolsTab(page);

  if (url) {
    await openSourceExplorerPanel(page);
    await openSource(page, url);
  }

  const line = await getSourceLine(page, lineNumber);
  const numberLocator = line.locator(`[data-test-id="SourceLine-LineNumber-${lineNumber}"]`);
  await numberLocator.waitFor();
  await numberLocator.hover({ force: true });
  const toggle = line.locator('[data-test-name="LogPointToggle"]');
  await toggle.waitFor();
  const state = await toggle.getAttribute("data-test-state");
  if (state !== "on") {
    await toggle.click({ force: true });
  }

  await waitForLogpoint(page, options);
  await editLogPoint(page, options);
}

export async function closeSource(page: Page, url: string): Promise<void> {
  await debugPrint(page, `Closing source "${chalk.bold(url)}"`, "openSource");

  const sourceTab = getSourceTab(page, url);

  if (await sourceTab.isVisible()) {
    await sourceTab.locator("button").click();
  }

  await sourceTab.waitFor({ state: "detached" });
}

export async function editLogPoint(
  page: Page,
  options: {
    content?: string;
    condition?: string;
    lineNumber: number;
    saveAfterEdit?: boolean;
    url: string;
  }
) {
  const { condition, content, lineNumber, saveAfterEdit = true, url } = options;

  await debugPrint(
    page,
    `Editing log-point at ${chalk.bold(`${url}:${lineNumber}`)}`,
    "editLogPoint"
  );

  if (condition != null || content != null) {
    const line = await getSourceLine(page, lineNumber);

    const isEditing = await line.locator('[data-lexical-editor="true"]').isVisible();
    if (!isEditing) {
      await line.locator('[data-test-name="PointPanel-EditButton"]').click();
    }

    if (condition != null) {
      await addConditional(page, { condition, lineNumber });
    }

    if (content != null) {
      await debugPrint(page, `Setting log-point content "${chalk.bold(content)}"`, "addLogpoint");

      await typeLexical(
        page,
        `${getSourceLineSelector(lineNumber)} [data-test-name="PointPanel-ContentInput"]`,
        content,
        false
      );
    }

    if (saveAfterEdit) {
      const saveButton = line.locator('[data-test-name="PointPanel-SaveButton"]');
      await expect(saveButton).toBeEnabled();
      await saveButton.click();
      await saveButton.waitFor({ state: "detached" });
    }
  }
}

export function getLogPointPanelConditionTypeAhead(page: Page): Locator {
  return page.locator('[data-test-name="PointPanel-ConditionInput-CodeTypeAhead"]');
}

export function getLogPointPanelContentTypeAhead(page: Page): Locator {
  return page.locator('[data-test-name="PointPanel-ContentInput-CodeTypeAhead"]');
}

export async function getSelectedLineNumber(page: Page): Promise<number | null> {
  let currentLineLocator = null;

  const lineLocator = page.locator(`[data-test-id^=SourceLine`);
  for (let index = 0; index < (await lineLocator.count()); index++) {
    const line = lineLocator.nth(index);
    const currentHighlight = lineLocator.locator(
      '[data-test-name="CurrentExecutionPointLineHighlight"]'
    );
    if (await currentHighlight.isVisible()) {
      currentLineLocator = line;
      break;
    }
  }

  if (currentLineLocator === null) {
    return null;
  }

  const lineNumber = await currentLineLocator.locator(`[data-test-id^="SourceLine-LineNumber"`);
  const textContent = await lineNumber.textContent();
  return textContent !== null ? parseInt(textContent, 10) : null;
}

export async function getSourceLine(page: Page, lineNumber: number): Promise<Locator> {
  const source = await getCurrentSource(page);
  return source!.locator(`[data-test-id=SourceLine-${lineNumber}]`);
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
    const capsule = pointPanelLocator.locator('[data-test-name="LogPointCapsule"]');
    await capsule.click();

    await contextMenu.waitFor();
  }
}

export async function removeAllBreakpoints(page: Page): Promise<void> {
  await debugPrint(page, `Removing all breakpoints for the current source`, "removeBreakpoint");

  while (true) {
    const breakpoint = page.locator(".editor.new-breakpoint");
    const count = await breakpoint.count();
    if (count > 0) {
      await breakpoint.click();
    } else {
      return;
    }
  }
}

export async function removeAllLogpoints(page: Page): Promise<void> {
  await debugPrint(page, `Removing all logpoints for the current source`, "removeAllLogpoints");

  while (true) {
    const panels = page.locator(".breakpoint-panel");
    const count = await panels.count();
    if (count > 0) {
      const panel = panels.first();
      await panel.hover();

      await page.locator('[data-test-id="ToggleLogpointButton"]').click();
    } else {
      return;
    }
  }
}

export async function removeBreakpoint(
  page: Page,
  options: {
    lineNumber: number;
    url: string;
  }
): Promise<void> {
  const { lineNumber, url } = options;

  await debugPrint(
    page,
    `Removing breakpoint at ${chalk.bold(`${url}:${lineNumber}`)}`,
    "removeBreakpoint"
  );

  await openDevToolsTab(page);

  if (url) {
    await openSourceExplorerPanel(page);
    await openSource(page, url);
  }

  const lineLocator = await getSourceLine(page, lineNumber);
  const numberLocator = lineLocator.locator(`[data-test-id="SourceLine-LineNumber-${lineNumber}"]`);
  await numberLocator.hover({ force: true });
  await numberLocator.click({ force: true });

  // We want to add a slight delay after removing a breakpoint so that the
  // breakpoint logic will have time to send protocol commands to the server,
  // since that is not guaranteed to happen synchronously on click. This is
  // important for cases where we remove a breakpoint and then immediately
  // attempt to step across the breakpoint location.
  await delay(500);
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

  if (url) {
    await openSourceExplorerPanel(page);
    await openSource(page, url);
  }

  const line = await getSourceLine(page, lineNumber);
  const numberLocator = line.locator(`[data-test-id="SourceLine-LineNumber-${lineNumber}"]`);
  await numberLocator.waitFor();
  await numberLocator.hover({ force: true });
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

export async function waitForBreakpoint(
  page: Page,
  options: {
    columnIndex?: number;
    lineNumber: number;
    url: string;
  }
): Promise<void> {
  const { columnIndex, lineNumber, url } = options;

  await debugPrint(
    page,
    `Waiting for breakpoint at ${chalk.bold(`${url}:${lineNumber}`)}`,
    "waitForBreakpoint"
  );

  await openPauseInformationPanel(page);

  const breakpointGroup = await page.waitForSelector(`.breakpoints-list-source:has-text("${url}")`);

  if (columnIndex != null) {
    await breakpointGroup.waitForSelector(
      `.breakpoint-line:has-text("${lineNumber}:${columnIndex}")`
    );
  } else {
    await breakpointGroup.waitForSelector(`.breakpoint-line:has-text("${lineNumber}")`);
  }
}

export async function waitForLogpoint(
  page: Page,
  options: {
    columnIndex?: number;
    lineNumber: number;
    url: string;
  }
): Promise<void> {
  const { lineNumber, url } = options;

  await debugPrint(
    page,
    `Waiting for log-point at ${chalk.bold(`${url}:${lineNumber}`)}`,
    "waitForLogpoint"
  );

  await openDevToolsTab(page);

  if (url) {
    await openSourceExplorerPanel(page);
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

  await openSourceExplorerPanel(page);

  if (url) {
    await openSource(page, url);
  }

  await debugPrint(
    page,
    `Verifying breakpoint status "${chalk.bold(expectedStatus)}" for line ${chalk.bold(
      options.lineNumber
    )}`,
    "verifyLogpointStep"
  );

  const line = await getSourceLine(page, lineNumber);
  const status = line.locator(`[data-test-name="LogPointStatus"]:has-text("${expectedStatus}")`);
  await status.waitFor();
}

// TODO [FE-626] Rewrite this helper to reduce complexity.
export async function waitForSelectedSource(page: Page, url: string) {
  await waitFor(async () => {
    const editorPanel = page.locator("#toolbox-content-debugger");
    const sourceHeader = editorPanel.locator(`[data-test-name="Source-${url}"]`);

    await expect(await sourceHeader.getAttribute("data-status")).toBe("active");

    // Make sure the visible source is the same source as the selected tab.
    const headerSourceId = await sourceHeader.getAttribute("data-test-sourceid");
    expect(
      await page.locator('[data-test-name="Source"]:visible').getAttribute("data-test-sourceid")
    ).toBe(headerSourceId);

    // HACK Assume that the source file has loaded when the combined text of the first
    // 10 lines is no longer an empty string
    const lines = editorPanel.locator(`[data-test-id^=SourceLine]`);

    const lineTexts = await mapLocators(lines, lineLocator => lineLocator.textContent());
    const numLines = await lines.count();

    const combinedLineText = lineTexts
      .slice(0, 10)
      .join()
      .trim()
      // Remove zero-width spaces, which would be considered non-empty
      .replace(/[\u200B-\u200D\uFEFF]/g, "");

    expect(numLines).toBeGreaterThan(0);
    expect(combinedLineText).not.toBe("");
  });
}
