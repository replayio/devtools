import { expect, test as base, PlaywrightTestArgs, Locator } from "@playwright/test";
import { waitFor } from "@playwright-testing-library/test";
import {
  locatorFixtures as fixtures,
  LocatorFixtures as TestingLibraryFixtures,
} from "@playwright-testing-library/test/fixture";
import chalk from "chalk";

export const test = base.extend<TestingLibraryFixtures>(fixtures);
test.use({
  testIdAttribute: "data-test-id",
});

export type TestArgs = PlaywrightTestArgs & TestingLibraryFixtures;
export type Screen = TestArgs["screen"];
export type Within = TestArgs["within"];

const exampleRecordings = require("./examples.json");

type Expected = string | boolean | number;
type MessageType =
  | "console-error"
  | "console-log"
  | "console-warning"
  | "event"
  | "exception"
  | "log-point"
  | "terminal-expression";

function debugPrint(message: string, scope?: string) {
  console.log(message, scope ? chalk.dim(`(${scope})`) : "");
}

export async function openExample(screen: Screen, example: string) {
  const recordingId = exampleRecordings[example];
  const base = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:8080";
  const url = `${base}/recording/${recordingId}?e2e=1`;

  debugPrint(`Navigating to ${chalk.bold(url)}`, "openExample");

  await screen.goto(url);
}

export async function clickDevTools(screen: Screen) {
  return screen.queryByTestId("ViewToggle-DevTools").click();
}

export async function selectConsole(screen: Screen) {
  return screen.queryByTestId("PanelButton-console").click();
}

export async function getCallStackPane(screen: Screen) {
  return screen.queryByTestId("AccordionPane-CallStack");
}

export async function getBreakpointsPane(screen: Screen) {
  return screen.locator('[data-test-id="AccordionPane-Breakpoints"]');
}

export async function openPauseInformation(screen: Screen) {
  // Only click if it's not already open; clicking again will collapse the side bar.
  const pane = await getBreakpointsPane(screen);
  const isVisible = await pane.isVisible();

  if (!isVisible) {
    await screen.locator('[data-test-name="ToolbarButton-PauseInformation"]').click();
  }
}

export async function getSourcesPane(screen: Screen) {
  return screen.locator('[data-test-id="AccordionPane-Sources"]');
}

export async function openSourceExplorer(screen: Screen) {
  // Only click if it's not already open; clicking again will collapse the side bar.
  const pane = await getSourcesPane(screen);
  const isVisible = await pane.isVisible();
  if (!isVisible) {
    return screen.locator('[data-test-name="ToolbarButton-SourceExplorer"]').click();
  }
}

// Console

export function delay(timeout: number) {
  return new Promise(r => setTimeout(r, timeout));
}

export async function checkEvaluateInTopFrame(screen: Screen, value: string, expected: Expected) {
  await selectConsole(screen);

  const consoleRoot = screen.queryByTestId("ConsoleRoot");
  await consoleRoot.locator("text=Unavailable...").waitFor({ state: "hidden" });

  const term = screen.queryByTestId("JSTerm");
  const textArea = term.locator("textarea");

  await textArea.focus();
  await textArea.type(value);

  await textArea.press("Enter");

  await waitForConsoleMessage(screen, expected, "terminal-expression");
  await clearConsoleEvaluations(screen);
}

export async function getConsoleMessage(
  screen: Screen,
  expected: Expected,
  messageType?: MessageType
) {
  const attributeSelector = messageType
    ? `[data-test-message-type="${messageType}"]`
    : '[data-test-name="Message"]';

  return screen.locator(`${attributeSelector}:has-text("${expected}")`);
}

export async function seekToConsoleMessage(screen: Screen, consoleMessage: Locator) {
  const textContent = await consoleMessage.textContent();

  debugPrint(`Seeking to message "${chalk.bold(textContent)}"`, "seekToConsoleMessage");

  await consoleMessage.hover();
  await consoleMessage.locator('[data-test-id="ConsoleMessageHoverButton"]').click();
}

export async function waitForConsoleMessage(
  screen: Screen,
  expected: Expected,
  messageType?: MessageType
) {
  const attributeSelector = messageType
    ? `[data-test-message-type="${messageType}"]`
    : '[data-test-name="Message"]';

  await screen.waitForSelector(`${attributeSelector}:has-text("${expected}")`);
}

export async function warpToMessage(screen: Screen, text: string, line?: number) {
  const msg = await getConsoleMessage(screen, text);
  await msg.hover();
  const warpButton = msg.locator('[data-test-id="ConsoleMessageHoverButton"]');

  await warpButton.hover();
  await warpButton.click();

  await waitForPaused(screen, line);
}

export async function executeInConsole(screen: Screen, text: string) {
  // TODO [PR 7550]
}

export async function checkMessageObjectContents(
  screen: Screen,
  message: HTMLElement,
  expectedContents: Expected[]
) {
  // TODO [PR 7550]
}

export async function checkJumpIcon(screen: Screen, message: string) {
  return screen.waitForSelector(`.message:has-text('${message}') .jump-definition`);
}

export async function clearConsoleEvaluations(screen: Screen) {
  return screen.queryByTestId("ClearConsoleEvaluationsButton").click();
}

export async function expandFilterCategory(screen: Screen, categoryName: string) {
  const consoleFilters = screen.queryByTestId("ConsoleFilterToggles");

  const categoryLabel = consoleFilters.locator(`[data-test-name="Expandable"]`, {
    hasText: categoryName,
  });

  const state = await categoryLabel.getAttribute("data-test-state");
  if (state === "closed") {
    await categoryLabel.click();
  }
}

const categoryNames = {
  keyboard: "Keyboard",
  mouse: "Mouse",
  pointer: "Pointer",
  timer: "Timer",
  websocket: "WebSocket",
};

export async function addEventListenerLogpoints(screen: Screen, eventTypes: string[]) {
  for (let eventType of eventTypes) {
    const [, categoryKey, eventName] = eventType.split(".");
    await expandFilterCategory(screen, categoryNames[categoryKey]);
    await screen.queryByTestId(`EventTypes-${eventType}`).setChecked(true);
  }
}

// Debugger

export async function getCurrentCallStackFrameInfo(screen: Screen) {
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

export async function verifyBreakpointStatus(
  screen: Screen,
  expectedStatus: string,
  options: {
    lineNumber: number;
    url?: string;
  }
) {
  const { lineNumber, url } = options;

  await openSourceExplorer(screen);

  if (url) {
    await selectSource(screen, url);
  }

  debugPrint(
    `Verifying breakpoint status "${chalk.bold(expectedStatus)}" for line ${chalk.bold(
      options.lineNumber
    )}`,
    "verifyBreakpointStatus"
  );

  const line = await getSourceLine(screen, lineNumber);
  const status = line.locator(
    `[data-test-name="LogpointPanel-BreakpointStatus"]:has-text("${expectedStatus}")`
  );
  await status.waitFor({ state: "visible" });
}

export async function getSelectedLineNumber(screen: Screen) {
  const lineNumber = await screen.locator(".new-debug-line .CodeMirror-linenumber");
  const textContent = await lineNumber.textContent();
  return textContent;
}

export function getSourceLine(screen: Screen, lineNumber: number) {
  return screen
    .locator(".CodeMirror-code div", {
      has: screen.locator(`.CodeMirror-linenumber:text-is("${lineNumber}")`),
    })
    .first();
}

export async function addLogpoint(
  screen: Screen,
  options: {
    columnIndex?: number;
    lineNumber: number;
    url: string;
  }
) {
  const { lineNumber, url } = options;

  debugPrint(`Adding log-point at ${chalk.bold(`${url}:${lineNumber}`)}`, "addLogpoint");

  await clickDevTools(screen);

  if (url) {
    await openSourceExplorer(screen);
    await selectSource(screen, url);
  }

  const line = await getSourceLine(screen, lineNumber);
  await line.hover();
  await line.locator('[data-test-id="ToggleLogpointButton"]').click();

  await waitForLogpoint(screen, options);
}

export async function waitForBreakpoint(
  screen: Screen,
  options: {
    columnIndex?: number;
    lineNumber: number;
    url: string;
  }
) {
  const { columnIndex, lineNumber, url } = options;

  debugPrint(
    `Waiting for breakpoint at ${chalk.bold(`${url}:${lineNumber}`)}`,
    "waitForBreakpoint"
  );

  await openPauseInformation(screen);

  const breakpointGroup = await screen.waitForSelector(
    `.breakpoints-list-source:has-text("${url}")`
  );

  if (columnIndex != null) {
    await breakpointGroup.waitForSelector(
      `.breakpoint-line:has-text("${lineNumber}:${columnIndex}")`
    );
  } else {
    await breakpointGroup.waitForSelector(`.breakpoint-line:has-text("${lineNumber}")`);
  }
}

export async function waitForLogpoint(
  screen: Screen,
  options: {
    columnIndex?: number;
    lineNumber: number;
    url: string;
  }
) {
  const { lineNumber, url } = options;

  debugPrint(`Waiting for log-point at ${chalk.bold(`${url}:${lineNumber}`)}`, "waitForLogpoint");

  await clickDevTools(screen);

  if (url) {
    await openSourceExplorer(screen);
    await selectSource(screen, url);
  }

  const line = getSourceLine(screen, lineNumber);
  await line.locator(".CodeMirror-linewidget").waitFor({ state: "visible" });
}

export async function addBreakpoint(
  screen: Screen,
  options: {
    columnIndex?: number;
    lineNumber: number;
    url: string;
  }
) {
  const { lineNumber, url } = options;

  debugPrint(`Adding breakpoint at ${chalk.bold(`${url}:${lineNumber}`)}`, "addBreakpoint");

  await clickDevTools(screen);

  if (url) {
    await openSourceExplorer(screen);
    await selectSource(screen, url);
  }

  const line = await getSourceLine(screen, lineNumber);
  await line.locator(".CodeMirror-linenumber").hover();
  await line.locator(".CodeMirror-linenumber").click();

  await waitForBreakpoint(screen, options);
}

export function getSourceTab(screen: Screen, url: string) {
  return screen.locator(`[data-test-name="Source-${url}"]`);
}

export function getMessageSourceLink(message: Locator) {
  return message.locator(`[data-test-name="Console-Source"]`);
}

export async function openMessageSource(consoleMessage: Locator) {
  const sourceLink = getMessageSourceLink(consoleMessage);
  const textContent = await sourceLink.textContent();

  debugPrint(`Opening message source "${chalk.bold(textContent)}"`, "openMessageSource");

  await sourceLink.click();
}

export async function quickOpen(screen: Screen, url: string) {
  debugPrint("Opening quick-open dialog", "quickOpen");
  await screen.keyboard.press("Meta+P");
  await screen.focus('[data-test-id="QuickOpenInput"]');

  debugPrint(`Filtering files by "${chalk.bold(url)}"`, "quickOpen");
  await screen.keyboard.type(url);
  await screen.waitForSelector(`[data-test-id="QuickOpenResultsList"]:has-text("${url}")`);

  debugPrint(`Opening file "${chalk.bold(url)}"`, "quickOpen");
  await screen.keyboard.press("Enter");
  await screen.waitForSelector(`[data-test-name="Source-${url}"]`);
}

export async function closeSource(screen: Screen, url: string) {
  debugPrint(`Closing source "${chalk.bold(url)}"`, "selectSource");

  const sourceTab = getSourceTab(screen, url);

  if (await sourceTab.isVisible()) {
    await sourceTab.locator("button").click();
  }

  await sourceTab.waitFor({ state: "detached" });
}

export async function selectSource(screen: Screen, url: string) {
  // If the source is already open, just focus it.
  const sourceTab = getSourceTab(screen, url);
  if (await sourceTab.isVisible()) {
    debugPrint(`Source "${chalk.bold(url)}" already open`, "selectSource");
    return;
  }

  debugPrint(`Opening source "${chalk.bold(url)}"`, "selectSource");

  // Otherwise find it in the sources tree.
  const pane = await getSourcesPane(screen);

  let foundSource = false;

  while (true) {
    // Wait for the panel's HTML to settle (to reflect the new toggled state.)
    await pane.innerHTML();

    const item = await pane.locator(`[data-item-name="SourceTreeItem-${url}"]`);
    let count = await item.count();
    if (count > 0) {
      foundSource = true;

      // We found the source; open it and then bail.
      await item.click();

      break;
    }

    // Keep drilling in until we find the source.
    const toggles = await pane.locator('[aria-expanded="false"][data-expandable="true"]');
    count = await toggles.count();
    if (count === 0) {
      break;
    }

    await toggles.first().click();
  }

  if (!foundSource) {
    // We didn't find a matching source; the test should fail.
    throw new Error(`Could not find source with URL "${url}"`);
  }

  await waitForSelectedSource(screen, url);
}

function waitForSelectedSource(screen: Screen, url?: string) {
  if (!url) {
    return;
  }
  return waitFor(async () => {
    const editorPanel = screen.locator("#toolbox-content-debugger");
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

export async function removeBreakpoint(
  screen: Screen,
  options: {
    lineNumber: number;
    url: string;
  }
) {
  const { lineNumber, url } = options;

  debugPrint(`Removing breakpoint at ${chalk.bold(`${url}:${lineNumber}`)}`, "removeBreakpoint");

  await clickDevTools(screen);

  if (url) {
    await openSourceExplorer(screen);
    await selectSource(screen, url);
  }

  const line = await getSourceLine(screen, lineNumber);
  await line.locator(".CodeMirror-linenumber").click({ force: true });
}

export async function removeAllBreakpoints(screen: Screen) {
  while (true) {
    const breakpoint = screen.locator(".editor.new-breakpoint");
    const count = await breakpoint.count();
    if (count > 0) {
      await breakpoint.click();
    } else {
      return;
    }
  }
}

export async function toggleBreakpoint(screen: Screen, number: number) {
  await screen.locator(`text=${number}`).click();
}

export async function rewind(screen: Screen) {
  await openPauseInformation(screen);

  const button = screen.getByTitle("Rewind Execution");
  await button.click();
}

export async function resumeToLine(
  screen: Screen,
  options: {
    lineNumber: number;
    url?: string;
  }
) {
  const { url = null, lineNumber } = options;

  if (url !== null) {
    await selectSource(screen, url);
  }

  await openPauseInformation(screen);

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

export async function rewindToLine(
  screen: Screen,
  options: {
    lineNumber?: number;
    url?: string;
  } = {}
) {
  const { url = null, lineNumber = null } = options;

  if (url !== null) {
    await selectSource(screen, url);
  }

  await openPauseInformation(screen);

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

export async function stepInToLine(screen: Screen, line: number) {
  await openPauseInformation(screen);
  await screen.queryByTitle("Step In").click();

  await waitForPaused(screen, line);
}

export async function stepOutToLine(screen: Screen, line: number) {
  await openPauseInformation(screen);
  await screen.queryByTitle("Step Out").click();

  await waitForPaused(screen, line);
}

export async function stepOverToLine(screen: Screen, line: number) {
  await openPauseInformation(screen);
  await screen.queryByTitle("Step Over").click();

  await waitForPaused(screen, line);
}

export async function reverseStepOverToLine(screen: Screen, line: number) {
  await openPauseInformation(screen);
  await screen.queryByTitle("Reverse Step Over").click();

  await waitForPaused(screen, line);
}

export async function selectFrame(screen: Screen, index: number) {
  const framesPanel = getFramesPanel(screen);

  const frameListItems = framesPanel.locator(".frame");
  await frameListItems.nth(index).click();
}

export async function waitForFrameTimeline(screen: Screen, width: string) {
  await screen.waitForFunction(
    params => {
      const elem: HTMLElement | null = document.querySelector(".frame-timeline-progress");
      return elem?.style.width == params.width;
    },
    { width }
  );
}

export async function waitForPaused(screen: Screen, line?: number) {
  await openPauseInformation(screen);

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
      const { fileName, lineNumber } = await getCurrentCallStackFrameInfo(screen);
      expect(lineNumber).toBe(line);
    });
  }
}

export async function checkFrames(screen: Screen, count: number) {
  const framesPanel = getFramesPanel(screen);
  return waitFor(async () => {
    const frameListItems = framesPanel.locator(".frame");
    const numFrames = await frameListItems.count();
    expect(numFrames === count).toBe(true);
  });
}

export function getScopesPanel(screen: Screen) {
  return screen.locator('[data-test-name="ScopesList"]');
}

export function getFramesPanel(screen: Screen) {
  return screen.queryByTestId("FramesPanel");
}

export async function expandFirstScope(screen: Screen) {
  const expander = getScopesPanel(screen).locator('[data-test-name="Expandable"]').first();
  if ((await expander.getAttribute("data-test-state")) === "closed") {
    await expander.click();
  }
}

export async function waitForScopeValue(screen: Screen, name: string, value: string) {
  await expandFirstScope(screen);
  return getScopesPanel(screen)
    .locator(
      `[data-test-name="KeyValue"]:has([data-test-name="KeyValue-Header"]:text-is("${name}")):has([data-test-name="ClientValue"]:text-is("${value}"))`
    )
    .waitFor();
}

export async function reverseStepOver(screen: Screen) {
  await openPauseInformation(screen);
  await screen.queryByTitle("Reverse Step Over").click();
}

export async function stepOver(screen: Screen) {
  await openPauseInformation(screen);
  await screen.queryByTitle("Step Over").click();
}

export async function clickSourceTreeNode(screen: Screen, node: string) {
  debugPrint(`Selecting source tree node: ${chalk.bold(node)}`);
  await screen.locator(`div[role="tree"] div:has-text("${node}")`).nth(1).click();
}
