import { expect, Locator, Page } from "@playwright/test";
import chalk from "chalk";

import { openDevToolsTab, waitFor } from ".";
import { openPauseInformationPanel } from "./pause-information-panel";
import { openSource, openSourceExplorerPanel } from "./source-explorer-panel";
import { clearTextArea, debugPrint } from "./utils";

export async function addBreakpoint(
  page: Page,
  options: {
    columnIndex?: number;
    lineNumber: number;
    url: string;
  }
): Promise<void> {
  const { lineNumber, url } = options;

  debugPrint(`Adding breakpoint at ${chalk.bold(`${url}:${lineNumber}`)}`, "addBreakpoint");

  await openDevToolsTab(page);

  if (url) {
    await openSourceExplorerPanel(page);
    await openSource(page, url);
  }

  await scrollUntilLineIsVisible(page, lineNumber);

  const line = await getSourceLine(page, lineNumber);
  await line.locator(".CodeMirror-linenumber").hover();
  await line.locator(".CodeMirror-linenumber").click();

  await waitForBreakpoint(page, options);
}

async function scrollUntilLineIsVisible(page: Page, lineNumber: number) {
  let loopCounter = 0;

  while (true) {
    const visibleLineNumbers = await getVisibleLineNumbers(page);

    if (visibleLineNumbers.includes(lineNumber)) {
      break;
    } else {
      if (loopCounter > 10) {
        throw new Error("Stuck in infinite scrolling loop looking for  line: " + lineNumber);
      }
    }
    // it must not be on screen, we have to scroll
    const [first] = visibleLineNumbers;

    const scrollUp = lineNumber < first;
    const deltaY = scrollUp ? -1000 : 1000;
    const scroller = page.locator(".CodeMirror-scroll").first();
    await scroller.click();
    await page.mouse.wheel(0, deltaY);
    loopCounter++;
  }
}

async function getVisibleLineNumbers(page: Page) {
  const lineNumberElements = page.locator(".CodeMirror-linenumber");
  const numElements = await lineNumberElements.count();

  const textContents = await lineNumberElements.allTextContents();
  const allLineNumbers = textContents.map(s => Number(s));

  const isLine1Visible = allLineNumbers.includes(1);
  const firstSliceIndex = isLine1Visible ? 0 : 9;
  // CodeMirror normally has a 10-line buffer on either side of the viewport.
  // Limit to just what's actually on screen
  const lineNumbers = allLineNumbers.slice(firstSliceIndex, allLineNumbers.length - 10);

  return lineNumbers;
}

export async function addLogpoint(
  page: Page,
  options: {
    columnIndex?: number;
    lineNumber: number;
    condition?: string;
    content?: string;
    url: string;
  }
): Promise<void> {
  const { condition, content, lineNumber, url } = options;

  debugPrint(`Adding log-point at ${chalk.bold(`${url}:${lineNumber}`)}`, "addLogpoint");

  await openDevToolsTab(page);

  if (url) {
    await openSourceExplorerPanel(page);
    await openSource(page, url);
  }

  const line = await getSourceLine(page, lineNumber);
  await line.hover();
  await line.locator('[data-test-id="ToggleLogpointButton"]').click();

  await waitForLogpoint(page, options);

  if (condition || content) {
    const line = getSourceLine(page, lineNumber);
    await line.locator('[data-test-name="LogpointContentSummary"]').click();

    if (condition) {
      debugPrint(`Setting log-point condition "${chalk.bold(condition)}"`, "addLogpoint");

      await line.locator('[data-test-name="EditLogpointConditionButton"]').click();

      // Condition and content both have text areas.
      await expect(line.locator("textarea")).toHaveCount(2);

      const textArea = await line.locator("textarea").first();
      await textArea.focus();
      await clearTextArea(page, textArea);
      await page.keyboard.type(condition);
    }

    if (content) {
      debugPrint(`Setting log-point content "${chalk.bold(content)}"`, "addLogpoint");

      // Condition and content both have text areas.
      // Content will always be the last one regardless of whether the condition text area is visible.
      const textArea = await line.locator("textarea").last();
      await textArea.waitFor();
      await textArea.focus();
      await clearTextArea(page, textArea);
      await page.keyboard.type(content);
    }

    const saveButton = await line.locator('button[title="Save expression"]');
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    const textArea = await line.locator("textarea");
    await textArea.waitFor({ state: "detached" });
  }
}

export async function closeSource(page: Page, url: string): Promise<void> {
  debugPrint(`Closing source "${chalk.bold(url)}"`, "openSource");

  const sourceTab = getSourceTab(page, url);

  if (await sourceTab.isVisible()) {
    await sourceTab.locator("button").click();
  }

  await sourceTab.waitFor({ state: "detached" });
}

export async function getSelectedLineNumber(page: Page): Promise<number | null> {
  const lineNumber = await page.locator(".new-debug-line .CodeMirror-linenumber");
  const textContent = await lineNumber.textContent();
  return textContent !== null ? parseInt(textContent, 10) : null;
}

export function getSourceLine(page: Page, lineNumber: number): Locator {
  return page
    .locator(".CodeMirror-code div", {
      has: page.locator(`.CodeMirror-linenumber:text-is("${lineNumber}")`),
    })
    .first();
}

export function getSourceTab(page: Page, url: string): Locator {
  return page.locator(`[data-test-name="Source-${url}"]`);
}

export async function removeAllBreakpoints(page: Page): Promise<void> {
  debugPrint(`Removing all breakpoints for the current source`, "removeBreakpoint");

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

export async function removeBreakpoint(
  page: Page,
  options: {
    lineNumber: number;
    url: string;
  }
): Promise<void> {
  const { lineNumber, url } = options;

  debugPrint(`Removing breakpoint at ${chalk.bold(`${url}:${lineNumber}`)}`, "removeBreakpoint");

  await openDevToolsTab(page);

  if (url) {
    await openSourceExplorerPanel(page);
    await openSource(page, url);
  }

  const line = await getSourceLine(page, lineNumber);
  await line.locator(".CodeMirror-linenumber").click({ force: true });
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

  debugPrint(
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

  debugPrint(`Waiting for log-point at ${chalk.bold(`${url}:${lineNumber}`)}`, "waitForLogpoint");

  await openDevToolsTab(page);

  if (url) {
    await openSourceExplorerPanel(page);
    await openSource(page, url);
  }

  const line = getSourceLine(page, lineNumber);
  await line.locator(".CodeMirror-linewidget").waitFor();
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

  debugPrint(
    `Verifying breakpoint status "${chalk.bold(expectedStatus)}" for line ${chalk.bold(
      options.lineNumber
    )}`,
    "verifyLogpointStep"
  );

  const line = await getSourceLine(page, lineNumber);
  const status = line.locator(
    `[data-test-name="LogpointPanel-BreakpointStatus"]:has-text("${expectedStatus}")`
  );
  await status.waitFor({ state: "visible" });
}

// TODO [FE-626] Rewrite this helper to reduce complexity.
export async function waitForSelectedSource(page: Page, url: string) {
  return waitFor(async () => {
    const editorPanel = page.locator("#toolbox-content-debugger");
    const sourceHeader = editorPanel.locator(`[data-test-name="Source-${url}"]`);
    const isTabActive = (await sourceHeader.getAttribute("data-status")) === "active";

    // HACK Assume that the source file has loaded when the combined text of the first
    // 10 lines is no longer an empty string
    const codeMirrorLines = editorPanel.locator(".CodeMirror-code .CodeMirror-line");

    const numLines = await codeMirrorLines.count();
    // Could be fewer than 10 lines visible, and I can't find a `.slice()` on `Locator`
    const linesToGrab = Math.min(numLines, 10);

    const lineTextPromises = Array.from({ length: linesToGrab }).map((_, i) => {
      return codeMirrorLines.nth(i).textContent();
    });
    const lineTexts = await Promise.all(lineTextPromises);

    const combinedLineText = lineTexts
      .join()
      .trim()
      // Remove zero-width spaces, which would be considered non-empty
      .replace(/[\u200B-\u200D\uFEFF]/g, "");

    expect(isTabActive && lineTexts.length > 0 && combinedLineText !== "").toBe(true);
  });
}
