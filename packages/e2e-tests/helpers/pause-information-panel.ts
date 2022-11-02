import { Locator, Page, expect } from "@playwright/test";
import chalk from "chalk";

import { openSource } from "./source-explorer-panel";
import { Expected } from "./types";
import { debugPrint, forEach, toggleExpandable, waitFor } from "./utils";

async function toggleAccordionPane(page: Page, pane: Locator, targetState: "open" | "closed") {
  const name = (await pane.getAttribute("data-test-id"))!.split("-")[1];
  const currentState = await pane.getAttribute("date-test-state");
  if (targetState !== currentState) {
    await debugPrint(page, `${name} pane to ${targetState}`, "toggleAccordionPane");
    await pane.locator('[role="button"]').click();
  } else {
    await debugPrint(page, `${name} pane already ${targetState}`, "toggleAccordionPane");
  }
}

export async function closeBreakpointsAccordionPane(page: Page): Promise<void> {
  await toggleAccordionPane(page, getBreakpointsAccordionPane(page), "closed");
}

export async function closeCallStackAccordionPane(page: Page): Promise<void> {
  await toggleAccordionPane(page, getCallStackAccordionPane(page), "closed");
}

export async function closePrintStatementsAccordionPane(page: Page): Promise<void> {
  await toggleAccordionPane(page, getPrintStatementsAccordionPane(page), "closed");
}

export async function expandAllScopesBlocks(page: Page): Promise<void> {
  await debugPrint(page, "Expanding all Scopes blocks", "expandAllScopesBlocks");

  const scopesPanel = getScopesPanel(page);
  const blocks = scopesPanel.locator('[data-test-name="ScopesInspector"]');

  const count = await blocks.count();
  if (count === 0) {
    throw Error(`No Scope blocks found`);
  }

  await forEach(blocks, async (block: Locator) => {
    await toggleExpandable(page, { scope: block });
  });
}

export function getBreakpointsAccordionPane(page: Page): Locator {
  return page.locator('[data-test-id="AccordionPane-Breakpoints"]');
}

export function getCallStackAccordionPane(page: Page): Locator {
  return page.locator('[data-test-id="AccordionPane-CallStack"]');
}

export async function getCurrentCallStackFrameInfo(page: Page): Promise<{
  fileName: string | null;
  lineNumber: number | null;
}> {
  const framesPanel = getFramesPanel(page);
  await framesPanel.waitFor();

  const selectedFrame = framesPanel.locator(".frame.selected");
  await selectedFrame.waitFor();

  const fileNameNode = selectedFrame.locator(".filename");
  const lineNumberNode = selectedFrame.locator(".line");
  const fileName = await fileNameNode.textContent();
  const lineNumber = await lineNumberNode.textContent();

  return {
    fileName: fileName || null,
    lineNumber: lineNumber ? parseInt(lineNumber, 10) : null,
  };
}

export function getFramesPanel(page: Page): Locator {
  return page.locator('[data-test-id="FramesPanel"]');
}

export function getPrintStatementsAccordionPane(page: Page): Locator {
  return page.locator('[data-test-id="AccordionPane-PrintStatements"]');
}

export function getScopesAccordionPane(page: Page): Locator {
  return page.locator('[data-test-id="AccordionPane-Scopes"]');
}

export function getScopeChildren(page: Page, text: string): Locator {
  const scope = page.locator(`[data-test-name="ScopesInspector"]`, {
    has: page.locator(`[data-test-name="ExpandablePreview"]:has-text("${text}")`),
  });
  return scope.locator('[data-test-name="ExpandableChildren"]');
}

export function getScopesPanel(page: Page): Locator {
  return page.locator('[data-test-name="ScopesList"]');
}

export async function openBreakpointsAccordionPane(page: Page): Promise<void> {
  await toggleAccordionPane(page, getBreakpointsAccordionPane(page), "open");
}

export async function openCallStackPane(page: Page): Promise<void> {
  await toggleAccordionPane(page, getCallStackAccordionPane(page), "open");
}

export async function openPauseInformationPanel(page: Page): Promise<void> {
  // Only click if it's not already open; clicking again will collapse the side bar.
  const pane = getBreakpointsAccordionPane(page);

  let isVisible = await pane.isVisible();

  if (!isVisible) {
    await page.locator('[data-test-name="ToolbarButton-PauseInformation"]').click();
  }
}

export async function openPrintStatementsAccordionPane(page: Page): Promise<void> {
  await toggleAccordionPane(page, getPrintStatementsAccordionPane(page), "open");
}

export async function openScopesAccordionPane(page: Page): Promise<void> {
  await toggleAccordionPane(page, getScopesAccordionPane(page), "open");
}

export async function openScopeBlocks(page: Page, text: string): Promise<void> {
  const blocks = page.locator(`[data-test-name="ScopesInspector"]:has-text("${text}")`);

  const count = await blocks.count();
  if (count === 0) {
    throw Error(`No Scope blocks found containing text "${text}"`);
  }

  await debugPrint(
    page,
    `Found ${count} Scope blocks with text "${chalk.bold(text)}"`,
    "openScopeBlocks"
  );

  await forEach(blocks, async block => {
    const expandable = block.locator('[data-test-name="Expandable"][data-test-state="closed"]');
    if ((await expandable.count()) > 0) {
      await debugPrint(page, `Opening Scope block`, "openScopeBlocks");

      await expandable.click();
    }
  });
}

export async function resumeToLine(
  page: Page,
  options: {
    lineNumber: number;
    url?: string;
  }
): Promise<void> {
  const { url = null, lineNumber } = options;

  await debugPrint(
    page,
    `Resuming to line ${chalk.bold(url ? `${url}:${lineNumber}` : lineNumber)}`,
    "resumeToLine"
  );

  if (url !== null) {
    await openSource(page, url);
  }

  await openPauseInformationPanel(page);

  while (true) {
    const button = page.locator('[title^="Resume"]');
    await button.click();

    const { lineNumber: selectedLineNumber } = await getCurrentCallStackFrameInfo(page);

    if (selectedLineNumber === null) {
      throw Error(`Unable to resume to line ${lineNumber}`);
    } else if (lineNumber === selectedLineNumber) {
      return;
    }
  }
}

export async function reverseStepOver(page: Page): Promise<void> {
  await debugPrint(page, "Reverse step over", "reverseStepOver");

  await openPauseInformationPanel(page);
  await page.locator('[title="Reverse Step Over"]').click();
}

export async function reverseStepOverToLine(page: Page, line: number) {
  await debugPrint(page, `Reverse step over to line ${chalk.bold(line)}`, "reverseStepOverToLine");

  await openPauseInformationPanel(page);
  await page.locator('[title="Reverse Step Over"]').click();

  await waitForPaused(page, line);
}

export async function rewind(page: Page) {
  await debugPrint(page, "Rewinding", "rewind");

  await openPauseInformationPanel(page);

  const button = page.locator('[title="Rewind Execution"]');
  await button.click();
}

export async function rewindToLine(
  page: Page,
  options: {
    lineNumber?: number;
    url?: string;
  } = {}
): Promise<void> {
  const { url = null, lineNumber = null } = options;

  await debugPrint(page, `Rewinding to line ${chalk.bold(lineNumber)}`, "rewindToLine");

  if (url !== null) {
    await openSource(page, url);
  }

  await openPauseInformationPanel(page);

  while (true) {
    const button = page.locator('[title="Rewind Execution"]');
    await button.click();

    if (lineNumber === null) {
      return;
    } else {
      const { lineNumber: selectedLineNumber } = await getCurrentCallStackFrameInfo(page);

      if (selectedLineNumber === null) {
        throw Error(`Unable to rewind to line ${lineNumber}`);
      } else if (lineNumber === selectedLineNumber) {
        return;
      }
    }
  }
}

export async function selectFrame(page: Page, index: number): Promise<void> {
  await debugPrint(page, `Select frame ${chalk.bold(index)}`, "selectFrame");

  const framesPanel = getFramesPanel(page);

  const frameListItems = framesPanel.locator(".frame");
  await frameListItems.nth(index).click();
}

export async function stepInToLine(page: Page, line: number) {
  await debugPrint(page, `Step in to line ${chalk.bold(line)}`, "stepInToLine");

  await openPauseInformationPanel(page);
  await page.locator('[title="Step In"]').click();

  await waitForPaused(page, line);
}

export async function stepOutToLine(page: Page, line: number) {
  await debugPrint(page, `Step out to line ${chalk.bold(line)}`, "stepOutToLine");

  await openPauseInformationPanel(page);
  await page.locator('[title="Step Out"]').click();

  await waitForPaused(page, line);
}

export async function stepOverToLine(page: Page, line: number) {
  await debugPrint(page, `Step over to line ${chalk.bold(line)}`, "stepOverToLine");

  await openPauseInformationPanel(page);
  await page.locator('[title="Step Over"]').click();

  await waitForPaused(page, line);
}

export async function stepOver(page: Page): Promise<void> {
  await debugPrint(page, "Step over", "stepOver");

  await openPauseInformationPanel(page);
  await page.locator('[title="Step Over"]').click();
}

export async function verifyFramesCount(page: Page, expectedCount: number) {
  const framesPanel = getFramesPanel(page);
  return waitFor(async () => {
    const frameListItems = framesPanel.locator(".frame");
    const numFrames = await frameListItems.count();
    expect(numFrames === expectedCount).toBe(true);
  });
}

export async function waitForFrameTimeline(page: Page, widthPercentage: string) {
  await debugPrint(
    page,
    `Waiting for frame progress ${chalk.bold(widthPercentage)}`,
    "waitForFrameTimeline"
  );

  await openPauseInformationPanel(page);

  await waitFor(async () => {
    const progress = page.locator(".frame-timeline-progress");
    const style = await progress.getAttribute("style");
    if (style) {
      const match = style.match("width: ([0-9]+%);");
      if (match) {
        const width = match![1];
        if (width === widthPercentage) {
          return;
        } else {
          throw `Frame progress is ${width}, expected ${widthPercentage}`;
        }
      }
    }

    throw `Frame progress could not be measured.`;
  });
}

export async function waitForPaused(page: Page, line?: number): Promise<void> {
  await debugPrint(
    page,
    `Waiting for pause ${line != null ? `at ${chalk.bold(line)}` : ""}`,
    "waitForPaused"
  );

  await openPauseInformationPanel(page);

  await waitFor(async () => {
    const scopesPanel = getScopesPanel(page);
    const framesPanel = getFramesPanel(page);

    const frameListItems = framesPanel.locator(".frame");
    const scopeBlocks = scopesPanel.locator('[data-test-name="Expandable"]');
    const [numFrames, numScopes] = await Promise.all([frameListItems.count(), scopeBlocks.count()]);

    expect(numFrames > 0 && numScopes > 0).toBe(true);
  });

  if (line) {
    await waitFor(async () => {
      const { lineNumber } = await getCurrentCallStackFrameInfo(page);
      expect(lineNumber).toBe(line);
    });
  }
}

export async function waitForScopeValue(page: Page, name: string, expectedValue: Expected) {
  await debugPrint(
    page,
    `Waiting for scope with variable "${chalk.bold(name)}" to have value "${chalk.bold(
      expectedValue
    )}"`,
    "waitForScopeValue"
  );

  const escapedValue =
    typeof expectedValue === "string" ? expectedValue.replace(/"/g, '\\"') : expectedValue;

  await expandAllScopesBlocks(page);

  const scopesPanel = getScopesPanel(page);
  const scopeValue = scopesPanel
    .locator(
      `[data-test-name="KeyValue"]:has([data-test-name="KeyValue-Header"]:text-is("${name}")):has-text("${escapedValue}")`
    )
    .first();
  await scopeValue.waitFor();
}
