import { waitFor } from "@playwright-testing-library/test";
import { expect, Locator } from "@playwright/test";
import chalk from "chalk";
import { openSource } from "./source-explorer-panel";

import { Screen } from "./types";
import { debugPrint } from "./utils";

export async function expandFirstScope(screen: Screen): Promise<void> {
  const expander = getScopesPanel(screen).locator('[data-test-name="Expandable"]').first();
  if ((await expander.getAttribute("data-test-state")) === "closed") {
    await expander.click();
  }
}

export function getBreakpointsPane(screen: Screen): Locator {
  return screen.locator('[data-test-id="AccordionPane-Breakpoints"]');
}

export function getCallStackPane(screen: Screen): Locator {
  return screen.queryByTestId("AccordionPane-CallStack");
}

export async function getCurrentCallStackFrameInfo(screen: Screen): Promise<{
  fileName: string | null;
  lineNumber: number | null;
}> {
  const framesPanel = getFramesPanel(screen);
  const selectedFrame = framesPanel.locator(".frame.selected");
  const fileNameNode = selectedFrame.locator(".filename");
  const lineNumberNode = selectedFrame.locator(".line");

  const fileName = await fileNameNode.textContent();
  const lineNumber = await lineNumberNode.textContent();
  return {
    fileName: fileName || null,
    lineNumber: lineNumber ? parseInt(lineNumber, 10) : null,
  };
}

export function getFramesPanel(screen: Screen): Locator {
  return screen.queryByTestId("FramesPanel");
}

export function getScopesPanel(screen: Screen): Locator {
  return screen.locator('[data-test-name="ScopesList"]');
}

export async function openPauseInformationPanel(screen: Screen): Promise<void> {
  // Only click if it's not already open; clicking again will collapse the side bar.
  const pane = getBreakpointsPane(screen);
  const isVisible = await pane.isVisible();
  if (!isVisible) {
    await screen.locator('[data-test-name="ToolbarButton-PauseInformation"]').click();
  }
}

export async function resumeToLine(
  screen: Screen,
  options: {
    lineNumber: number;
    url?: string;
  }
): Promise<void> {
  const { url = null, lineNumber } = options;

  debugPrint(
    `Resuming to line ${chalk.bold(url ? `${url}:${lineNumber}` : lineNumber)}`,
    "resumeToLine"
  );

  if (url !== null) {
    await openSource(screen, url);
  }

  await openPauseInformationPanel(screen);

  while (true) {
    const button = screen.getByTitle(/^Resume/);
    await button.click();

    const { lineNumber: selectedLineNumber } = await getCurrentCallStackFrameInfo(screen);

    if (selectedLineNumber === null) {
      throw Error(`Unable to resume to line ${lineNumber}`);
    } else if (lineNumber === selectedLineNumber) {
      return;
    }
  }
}

export async function reverseStepOver(screen: Screen): Promise<void> {
  debugPrint("Reverse step over", "reverseStepOver");

  await openPauseInformationPanel(screen);
  await screen.queryByTitle("Reverse Step Over").click();
}

export async function reverseStepOverToLine(screen: Screen, line: number) {
  debugPrint(`Reverse step over to line ${chalk.bold(line)}`, "reverseStepOverToLine");

  await openPauseInformationPanel(screen);
  await screen.queryByTitle("Reverse Step Over").click();

  await waitForPaused(screen, line);
}

export async function rewind(screen: Screen) {
  debugPrint("Rewinding", "rewind");

  await openPauseInformationPanel(screen);

  const button = screen.getByTitle("Rewind Execution");
  await button.click();
}

export async function rewindToLine(
  screen: Screen,
  options: {
    lineNumber?: number;
    url?: string;
  } = {}
): Promise<void> {
  const { url = null, lineNumber = null } = options;

  debugPrint(`Rewinding to line ${chalk.bold(lineNumber)}`, "rewindToLine");

  if (url !== null) {
    await openSource(screen, url);
  }

  await openPauseInformationPanel(screen);

  while (true) {
    const button = screen.getByTitle("Rewind Execution");
    await button.click();

    if (lineNumber === null) {
      return;
    } else {
      const { lineNumber: selectedLineNumber } = await getCurrentCallStackFrameInfo(screen);

      if (selectedLineNumber === null) {
        throw Error(`Unable to rewind to line ${lineNumber}`);
      } else if (lineNumber === selectedLineNumber) {
        return;
      }
    }
  }
}

export async function selectFrame(screen: Screen, index: number): Promise<void> {
  debugPrint(`Select frame ${chalk.bold(index)}`, "selectFrame");

  const framesPanel = getFramesPanel(screen);

  const frameListItems = framesPanel.locator(".frame");
  await frameListItems.nth(index).click();
}

export async function stepInToLine(screen: Screen, line: number) {
  debugPrint(`Step in to line ${chalk.bold(line)}`, "stepInToLine");

  await openPauseInformationPanel(screen);
  await screen.queryByTitle("Step In").click();

  await waitForPaused(screen, line);
}

export async function stepOutToLine(screen: Screen, line: number) {
  debugPrint(`Step out to line ${chalk.bold(line)}`, "stepOutToLine");

  await openPauseInformationPanel(screen);
  await screen.queryByTitle("Step Out").click();

  await waitForPaused(screen, line);
}

export async function stepOverToLine(screen: Screen, line: number) {
  debugPrint(`Step over to line ${chalk.bold(line)}`, "stepOverToLine");

  await openPauseInformationPanel(screen);
  await screen.queryByTitle("Step Over").click();

  await waitForPaused(screen, line);
}

export async function stepOver(screen: Screen): Promise<void> {
  debugPrint("Step over", "stepOver");

  await openPauseInformationPanel(screen);
  await screen.queryByTitle("Step Over").click();
}

export async function verifyFramesCount(screen: Screen, expectedCount: number) {
  const framesPanel = getFramesPanel(screen);
  return waitFor(async () => {
    const frameListItems = framesPanel.locator(".frame");
    const numFrames = await frameListItems.count();
    expect(numFrames === expectedCount).toBe(true);
  });
}

export async function waitForFrameTimeline(screen: Screen, widthPercentage: string) {
  debugPrint(`Waiting for frame progress ${chalk.bold(widthPercentage)}`, "waitForFrameTimeline");

  await openPauseInformationPanel(screen);
  await screen.waitForFunction(
    params => {
      const elem: HTMLElement | null = document.querySelector(".frame-timeline-progress");
      return elem?.style.width == params.widthPercentage;
    },
    { widthPercentage }
  );
}

export async function waitForPaused(screen: Screen, line?: number): Promise<void> {
  debugPrint(`Waiting for pause ${line != null ? `at ${chalk.bold(line)}` : ""}`, "waitForPaused");

  await openPauseInformationPanel(screen);

  await waitFor(async () => {
    const scopesPanel = getScopesPanel(screen);
    const framesPanel = getFramesPanel(screen);

    const frameListItems = framesPanel.locator(".frame");
    const scopeBlocks = scopesPanel.locator('[data-test-name="Expandable"]');
    const [numFrames, numScopes] = await Promise.all([frameListItems.count(), scopeBlocks.count()]);

    expect(numFrames > 0 && numScopes > 0).toBe(true);
  });

  if (line) {
    await waitFor(async () => {
      const { lineNumber } = await getCurrentCallStackFrameInfo(screen);
      expect(lineNumber).toBe(line);
    });
  }
}

export async function waitForScopeValue(screen: Screen, name: string, value: string) {
  await expandFirstScope(screen);

  const scopesPanel = getScopesPanel(screen);
  const scopeValue = scopesPanel.locator(
    `[data-test-name="KeyValue"]:has([data-test-name="KeyValue-Header"]:text-is("${name}")):has([data-test-name="ClientValue"]:text-is("${value}"))`
  );
  await scopeValue.waitFor();
}
