import { Page, Locator, expect, test as base, PlaywrightTestArgs } from "@playwright/test";
import { assert } from "protocol/utils";

import {
  locatorFixtures as fixtures,
  LocatorFixtures as TestingLibraryFixtures,
} from "@playwright-testing-library/test/fixture";

export const test = base.extend<TestingLibraryFixtures>(fixtures);

export type TestArgs = PlaywrightTestArgs & TestingLibraryFixtures;
export type Screen = TestArgs["screen"];
export type Within = TestArgs["within"];

const exampleRecordings = require("./examples.json");

type $FixTypeLater = any;

type Expected = string | boolean | number;

export async function openExample(screen: Screen, example: string) {
  const recordingId = exampleRecordings[example];
  const base = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:8080";
  const url = `${base}/recording/${recordingId}?e2e=1`;
  console.log(`Navigating to ${url}`);
  await screen.goto(url);
}

export async function clickDevTools(screen: Screen) {
  return screen.getByTestId("ViewToggle-DevTools").click();
}

export async function selectConsole(screen: Screen) {
  return screen.getByTestId("PanelButton-console").click();
}

export async function getBreakpointsPane(screen: Screen) {
  return screen.locator('[data-test-id="AccordionPane-Breakpoints"]');
}

export async function openPauseInformation(screen: Screen) {
  // Only click if it's not already open; clicking again will collapse the side bar.
  const pane = await getBreakpointsPane(screen);
  const isVisible = await pane.isVisible();
  if (!isVisible) {
    return screen.locator('[data-test-name="ToolbarButton-PauseInformation"]').click();
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

export async function togglePausePane(screen: Screen) {
  return screen.getByRole("button", { name: "motion_photos_paused" }).click();
}

// Console

export async function checkEvaluateInTopFrame(screen: Screen, value: string, expected: Expected) {
  await selectConsole(screen);

  await screen.evaluate(
    async params => {
      window.jsterm.setValue(params.value);
      await new Promise(r => setTimeout(r, 10));
      window.jsterm.execute();
    },
    { value }
  );

  await waitForConsoleMessage(screen, expected);
  await clearConsoleEvaluations(screen);
}

export async function getConsoleMessage(screen: Screen, message: Expected) {
  return screen.locator(`[data-test-name="Messages"]:has-text("${message}")`);
}

export async function waitForConsoleMessage(screen: Screen, message: Expected) {
  return screen.waitForSelector(`[data-test-name="Messages"]:has-text("${message}")`);
}

export async function warpToMessage(screen: Screen, text: string, line?: number) {
  const msg = await getConsoleMessage(screen, text);
  await msg.hover();
  const warpButton = msg.locator(".rewind .button") || msg.locator(".fast-forward");

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
  await screen.locator("#toolbox-content-console button").nth(1).click();
}

export async function addEventListenerLogpoints(screen: Screen, logpoints: string[]) {
  return screen.evaluate(params => app.actions.addEventListenerBreakpoints(params.logpoints), {
    logpoints,
  });
}

// Debugger

export async function getSourceLine(screen: Screen, lineNumber: number) {
  return screen.locator(".CodeMirror-gutter-wrapper", {
    has: screen.locator(`.CodeMirror-linenumber:has-text("${lineNumber}")`),
  });
}

export async function addBreakpoint(
  screen: Screen,
  url: string,
  lineNumber: number,
  columnIndex?: number
) {
  await clickDevTools(screen);
  await openSourceExplorer(screen);
  await selectSource(screen, url);

  const line = await getSourceLine(screen, lineNumber);
  await line.locator(".CodeMirror-linenumber").hover();
  await line.locator(".CodeMirror-linenumber").click();

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

async function selectSource(screen: Screen, url: string) {
  const pane = await getSourcesPane(screen);

  let foundSource = false;

  while (true) {
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
  return screen.waitForFunction(
    params => {
      const source = window.app.selectors!.getSelectedSourceWithContent()! || {};
      if (!source.value) {
        return false;
      }

      if (!params.url) {
        return true;
      }

      const newSource = app.selectors.fuzzyFindSourceByUrl(params.url)!;
      if (newSource.id != source.id) {
        return false;
      }

      // The hasSymbols check is disabled. Sometimes the parser worker fails for
      // unclear reasons. See https://github.com/RecordReplay/devtools/issues/433
      // return hasSymbols(source) && getBreakableLines(source.id);
      return app.selectors.getBreakableLinesForSource(source.id);
    },
    {
      url,
    }
  );
}

export async function removeAllBreakpoints(screen: Screen) {
  screen.evaluate(async () => {
    await app.actions.removeAllBreakpoints(app.selectors.getThreadContext());
    await app.threadFront.waitForInvalidateCommandsToFinish();
  });
}

async function getThreadContext(screen: Screen) {
  return screen.evaluate(() => window.app.selectors!.getThreadContext());
}

export async function toggleBreakpoint(screen: Screen, number: number) {
  await screen.locator(`text=${number}`).click();
}

export async function rewind(screen: Screen) {
  await screen.locator(".command-bar-button").first().click();
  await new Promise(r => setTimeout(r, 100));
  await screen.evaluate(() => window.app.selectors!.getIsPaused());
}

export async function resumeToLine(screen: Screen, line: number) {
  const cx = await getThreadContext(screen);
  await screen.evaluate(params => window.app.actions!.resume(params.cx), { cx: cx });

  await waitForPaused(screen, line);
}

export async function rewindToLine(screen: Screen, line?: number) {
  const cx = await getThreadContext(screen);
  await screen.evaluate(params => window.app.actions!.rewind(params.cx), { cx: cx });

  if (line) {
    await waitForPaused(screen, line);
  }
}

export async function stepInToLine(screen: Screen, line: number) {
  const cx = await getThreadContext(screen);
  await screen.evaluate(params => window.app.actions!.stepIn(params.cx), { cx: cx });

  await waitForPaused(screen, line);
}

export async function stepOutToLine(screen: Screen, line: number) {
  const cx = await getThreadContext(screen);
  await screen.evaluate(params => window.app.actions!.stepOut(params.cx), { cx: cx });

  await waitForPaused(screen, line);
}

export async function stepOverToLine(screen: Screen, line: number) {
  const cx = await getThreadContext(screen);
  await screen.evaluate(params => window.app.actions!.stepOver(params.cx), { cx: cx });

  await waitForPaused(screen, line);
}

export async function reverseStepOverToLine(screen: Screen, line: number) {
  const cx = await getThreadContext(screen);
  await screen.evaluate(params => window.app.actions!.reverseStepOver(params.cx), { cx: cx });

  await waitForPaused(screen, line);
}

export async function selectFrame(screen: Screen, index: number) {
  screen.evaluate(
    params => {
      const frames = app.selectors.getFrames()!;
      return app.actions.selectFrame(app.selectors.getThreadContext(), frames[params.index]);
    },
    { index }
  );
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
  await screen.evaluate(() =>
    window.app.store.dispatch({ type: "set_selected_primary_panel", panel: "debugger" })
  );

  await screen.waitForFunction(
    () => window.app.selectors!.getIsPaused() && window.app.selectors!.getSelectedScope() !== null
  );

  await screen.waitForFunction(() => window.app.selectors!.getFrames()!.length > 0);

  if (line) {
    await screen.waitForFunction(
      params => {
        const frame = window.app.selectors!.getVisibleSelectedFrame();
        return frame?.location?.line === params.line;
      },
      { line }
    );
  }

  screen.locator('.scopes-list .tree-node[aria-level="2"]');
}

export async function checkFrames(screen: Screen, count: number) {
  return screen.waitForFunction(
    params => {
      const frames = app.selectors.getFrames()!;
      return frames.length == params.count;
    },
    { count }
  );
}

export async function waitForScopeValue(screen: Screen, name: string, value: string) {
  await screen.waitForSelector(`.scopes-pane .object-node:has-text("${name}: ${value}")`);
}

export async function reverseStepOver(screen: Screen) {
  await screen.locator('[title="Reverse Step Over"]').click();
  await new Promise(r => setTimeout(r, 100));
  await screen.evaluate(() => window.app.selectors!.getIsPaused());
}

export async function stepOver(screen: Screen) {
  await screen.locator('[title="Step Over"]').click();
  await new Promise(r => setTimeout(r, 100));
  await screen.evaluate(() => window.app.selectors!.getIsPaused());
}

export async function clickSourceTreeNode(screen: Screen, node: string) {
  await screen.locator(`div[role="tree"] div:has-text("${node}")`).nth(1).click();
}
