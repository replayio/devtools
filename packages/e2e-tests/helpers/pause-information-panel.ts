import { Locator, Page, expect } from "@playwright/test";
import { SourceId } from "@replayio/protocol";
import chalk from "chalk";

import { POINT_BEHAVIOR_DISABLED_TEMPORARILY, POINT_BEHAVIOR_ENABLED } from "shared/client/types";

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

export async function closeCallStackAccordionPane(page: Page): Promise<void> {
  await toggleAccordionPane(page, getCallStackAccordionPane(page), "closed");
}

export async function closePrintStatementsAccordionPane(page: Page): Promise<void> {
  await toggleAccordionPane(page, getPrintStatementsAccordionPane(page), "closed");
}

export async function expandAllScopesBlocks(page: Page): Promise<void> {
  await debugPrint(page, "Expanding all Scopes blocks", "expandAllScopesBlocks");

  await openPauseInformationPanel(page);

  const scopesPanel = getScopesPanel(page);
  const blocks = scopesPanel.locator('[data-test-name="ScopesInspector"]');

  await waitFor(async () => {
    expect(await blocks.count()).toBeGreaterThan(0);
  });

  await forEach(blocks, async (block: Locator) => {
    await toggleExpandable(page, { scope: block });
  });
}

export async function closeSidePanel(page: Page) {
  // Ensure that it's closed by forcing the "Pause" pane to open instead...
  const pane = getPrintStatementsAccordionPane(page);
  const pauseButton = page.locator('[data-test-name="ToolbarButton-PauseInformation"]');
  await pauseButton.click();
  const isVisible = await pane.isVisible();
  if (isVisible) {
    await pauseButton.click();
  }
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

export async function openCallStackPane(page: Page): Promise<void> {
  await toggleAccordionPane(page, getCallStackAccordionPane(page), "open");
}

export async function openPauseInformationPanel(page: Page): Promise<void> {
  // Only click if it's not already open; clicking again will collapse the side bar.
  const pane = getPrintStatementsAccordionPane(page);

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

export async function clickCommandBarButton(page: Page, title: string): Promise<void> {
  await debugPrint(page, title, "clickCommandBarButton");

  await openPauseInformationPanel(page);

  const button = page.locator(`[title^="${title}"]`);
  await button.isEnabled();
  await button.click();
}

export async function reverseStepOver(page: Page): Promise<void> {
  await debugPrint(page, "Reverse step over", "reverseStepOver");

  await clickCommandBarButton(page, "Reverse Step Over");
}

export async function reverseStepOverToLine(page: Page, line: number) {
  await debugPrint(page, `Reverse step over to line ${chalk.bold(line)}`, "reverseStepOverToLine");

  await clickCommandBarButton(page, "Reverse Step Over");

  await waitForPaused(page, line);
}

export async function selectFrame(page: Page, index: number): Promise<void> {
  await debugPrint(page, `Select frame ${chalk.bold(index)}`, "selectFrame");

  await openPauseInformationPanel(page);

  const framesPanel = getFramesPanel(page);

  const frameListItems = framesPanel.locator(".frame");
  await frameListItems.nth(index).click();
}

export async function stepInToLine(page: Page, line: number) {
  await debugPrint(page, `Step in to line ${chalk.bold(line)}`, "stepInToLine");

  await clickCommandBarButton(page, "Step In");

  await waitForPaused(page, line);
}

export async function stepOutToLine(page: Page, line: number) {
  await debugPrint(page, `Step out to line ${chalk.bold(line)}`, "stepOutToLine");

  await clickCommandBarButton(page, "Step Out");

  await waitForPaused(page, line);
}

export async function stepOverToLine(page: Page, line: number) {
  await debugPrint(page, `Step over to line ${chalk.bold(line)}`, "stepOverToLine");

  await clickCommandBarButton(page, "Step Over");

  await waitForPaused(page, line);
}

export async function stepOver(page: Page): Promise<void> {
  await debugPrint(page, "Step over", "stepOver");

  await clickCommandBarButton(page, "Step Over");
}

export function waitForAllFramesToLoad(page: Page) {
  return waitFor(async () => {
    expect(await page.locator('[data-test-name="FramesLoading"]').count()).toBe(0);
  });
}

export function getAsyncParentCount(page: Page) {
  return page.locator('[data-test-name="AsyncParentLabel"]').count();
}

export async function isAsyncParentUnavailable(page: Page) {
  const asyncParentUnavailable = page.locator('[data-test-name="AsyncParentUnavailable"]');
  return (await asyncParentUnavailable.count()) > 0;
}

export async function verifyFramesCount(page: Page, expectedCount: number) {
  const framesPanel = getFramesPanel(page);
  return waitFor(async () => {
    const frameListItems = framesPanel.locator(".frame");
    const actualCount = await frameListItems.count();
    expect(actualCount).toBe(expectedCount);
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

  await waitFor(
    async () => {
      const scopesPanel = getScopesPanel(page);
      const framesPanel = getFramesPanel(page);

      const frameListItems = framesPanel.locator(".frame");
      const scopeBlocks = scopesPanel.locator('[data-test-name="Expandable"]');
      const [numFrames, numScopes] = await Promise.all([
        frameListItems.count(),
        scopeBlocks.count(),
      ]);

      expect(numFrames, { message: "Timed out waiting for frames" }).toBeGreaterThan(0);
      expect(numScopes, { message: "Timed out waiting for scopes" }).toBeGreaterThan(0);
    },
    { timeout: 15_000 }
  );

  if (line) {
    await waitFor(async () => {
      const { lineNumber } = await getCurrentCallStackFrameInfo(page);
      expect(lineNumber).toBe(line);
    });
  }
}

export async function waitForScopeValue(
  page: Page,
  name: string,
  expectedValue: Expected,
  expandScopes = true
) {
  await debugPrint(
    page,
    `Waiting for scope with variable "${chalk.bold(name)}" to have value "${chalk.bold(
      expectedValue
    )}"`,
    "waitForScopeValue"
  );

  const escapedValue =
    typeof expectedValue === "string" ? expectedValue.replace(/"/g, '\\"') : expectedValue;

  if (expandScopes) {
    await expandAllScopesBlocks(page);
  }

  const scopesPanel = getScopesPanel(page);
  const scopeValue = scopesPanel
    .locator(
      `[data-test-name="KeyValue"]:has([data-test-name="KeyValue-Header"]:text-is("${name}")):has-text("${escapedValue}")`
    )
    .first();
  await scopeValue.waitFor();
}

export function findPoints(
  page: Page,
  options: {
    sourceId?: SourceId;
    lineNumber?: number;
    columnIndex?: number;
  } = {}
) {
  const { columnIndex, lineNumber, sourceId } = options;

  const selectorCriteria = [
    '[data-test-name="LogPoint"]',
    columnIndex != null ? `[data-test-column-index="${columnIndex}"]` : "",
    lineNumber != null ? `[data-test-line-number="${lineNumber}"]` : "",
    sourceId != null ? `[data-test-source-id="${sourceId}"]` : "",
  ];

  return page.locator(selectorCriteria.join(""));
}

export async function isPointEditable(pointLocator: Locator) {
  const editButton = pointLocator.locator('[data-test-name="RemoveLogPointButton"]');
  return (await editButton.count()) > 0;
}

export async function removePoint(pointLocator: Locator) {
  await pointLocator.locator('[data-test-name="RemoveLogPointButton"]').first().click();
}

export async function togglePoint(page: Page, pointLocator: Locator, enabled: boolean) {
  const targetState = enabled ? POINT_BEHAVIOR_ENABLED : POINT_BEHAVIOR_DISABLED_TEMPORARILY;
  const toggle = pointLocator.locator('[data-test-name="LogPointToggle"]');
  const currentState = await toggle.getAttribute("date-test-state");
  if (targetState !== currentState) {
    await debugPrint(page, `Toggling point to ${targetState}`, "togglePoint");
    await toggle.locator("input").click();
  } else {
    await debugPrint(page, `Point already ${targetState}`, "togglePoint");
  }
}
