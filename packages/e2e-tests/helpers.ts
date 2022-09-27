import { Page, Locator, expect } from "@playwright/test";
import { assert } from "protocol/utils";

const exampleRecordings = require("./examples.json");

type $FixTypeLater = any;

type Expected = string | boolean | number;

export async function openExample(page: Page, example: string) {
  const recordingId = exampleRecordings[example];
  const base = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:8080";
  const url = `${base}/recording/${recordingId}?e2e=1`;
  console.log(`Navigating to ${url}`);
  await page.goto(url);
}

export async function clickDevTools(page: Page) {
  return page.locator('[data-test-id="ViewToggle-DevTools"]').click();
}

export async function selectConsole(page: Page) {
  return page.locator('[data-test-id="PanelButton-console"]').click();
}

export async function getBreakpointsPane(page: Page) {
  return page.locator('[data-test-id="AccordionPane-Breakpoints"]');
}

export async function openPauseInformation(page: Page) {
  // Only click if it's not already open; clicking again will collapse the side bar.
  const pane = await getBreakpointsPane(page);
  const isVisible = await pane.isVisible();
  if (!isVisible) {
    return page.locator('[data-test-name="ToolbarButton-PauseInformation"]').click();
  }
}

export async function getSourcesPane(page: Page) {
  return page.locator('[data-test-id="AccordionPane-Sources"]');
}

export async function openSourceExplorer(page: Page) {
  // Only click if it's not already open; clicking again will collapse the side bar.
  const pane = await getSourcesPane(page);
  const isVisible = await pane.isVisible();
  if (!isVisible) {
    return page.locator('[data-test-name="ToolbarButton-SourceExplorer"]').click();
  }
}

export async function togglePausePane(page: Page) {
  return page.locator('button:has-text("motion_photos_paused")').click();
}

// Console

export async function checkEvaluateInTopFrame(page: Page, value: string, expected: Expected) {
  await selectConsole(page);

  await page.evaluate(
    async params => {
      window.jsterm.setValue(params.value);
      await new Promise(r => setTimeout(r, 10));
      window.jsterm.execute();
    },
    { value }
  );

  await waitForConsoleMessage(page, expected);
  await clearConsoleEvaluations(page);
}

export async function getConsoleMessage(page: Page, message: Expected) {
  return page.locator(`[data-test-name="Messages"]:has-text("${message}")`);
}

export async function waitForConsoleMessage(page: Page, message: Expected) {
  return page.waitForSelector(`[data-test-name="Messages"]:has-text("${message}")`);
}

export async function warpToMessage(page: Page, text: string, line?: number) {
  const msg = await getConsoleMessage(page, text);
  await msg.hover();
  const warpButton = msg.locator(".rewind .button") || msg.locator(".fast-forward");

  await warpButton.hover();
  await warpButton.click();

  await waitForPaused(page, line);
}

export async function executeInConsole(page: Page, text: string) {
  // TODO [PR 7550]
}

export async function checkMessageObjectContents(
  page: Page,
  message: HTMLElement,
  expectedContents: Expected[]
) {
  // TODO [PR 7550]
}

export async function checkJumpIcon(page: Page, message: string) {
  return page.waitForSelector(`.message:has-text('${message}') .jump-definition`);
}

export async function clearConsoleEvaluations(page: Page) {
  await page.locator("#toolbox-content-console button").nth(1).click();
}

export async function addEventListenerLogpoints(page: Page, logpoints: string[]) {
  return page.evaluate(params => app.actions.addEventListenerBreakpoints(params.logpoints), {
    logpoints,
  });
}

// Debugger

export async function getSourceLine(page: Page, lineNumber: number) {
  return page.locator(".CodeMirror-gutter-wrapper", {
    has: page.locator(`.CodeMirror-linenumber:has-text("${lineNumber}")`),
  });
}

export async function addBreakpoint(
  page: Page,
  url: string,
  lineNumber: number,
  columnIndex?: number
) {
  await clickDevTools(page);
  await openSourceExplorer(page);
  await selectSource(page, url);

  const line = await getSourceLine(page, lineNumber);
  await line.locator(".CodeMirror-linenumber").hover();
  await line.locator(".CodeMirror-linenumber").click();

  await openPauseInformation(page);

  const breakpointGroup = await page.waitForSelector(`.breakpoints-list-source:has-text("${url}")`);
  if (columnIndex != null) {
    await breakpointGroup.waitForSelector(
      `.breakpoint-line:has-text("${lineNumber}:${columnIndex}")`
    );
  } else {
    await breakpointGroup.waitForSelector(`.breakpoint-line:has-text("${lineNumber}")`);
  }
}

export async function selectSource(page: Page, url: string) {
  const pane = await getSourcesPane(page);

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

  await waitForSelectedSource(page, url);
}

async function waitForSelectedSource(page: Page, url: string) {
  await page.waitForSelector(`[data-test-name="Source-${url}"]`);
}

export async function removeAllBreakpoints(page: Page) {
  page.evaluate(async () => {
    await app.actions.removeAllBreakpoints(app.selectors.getThreadContext());
    await app.threadFront.waitForInvalidateCommandsToFinish();
  });
}

async function getThreadContext(page: Page) {
  return page.evaluate(() => window.app.selectors!.getThreadContext());
}

export async function toggleBreakpoint(page: Page, number: number) {
  await page.locator(`text=${number}`).click();
}

export async function rewind(page: Page) {
  await page.locator(".command-bar-button").first().click();
  await new Promise(r => setTimeout(r, 100));
  await page.evaluate(() => window.app.selectors!.getIsPaused());
}

export async function resumeToLine(page: Page, line: number) {
  const cx = await getThreadContext(page);
  await page.evaluate(params => window.app.actions!.resume(params.cx), { cx: cx });

  await waitForPaused(page, line);
}

export async function rewindToLine(page: Page, line?: number) {
  const cx = await getThreadContext(page);
  await page.evaluate(params => window.app.actions!.rewind(params.cx), { cx: cx });

  if (line) {
    await waitForPaused(page, line);
  }
}

export async function stepInToLine(page: Page, line: number) {
  const cx = await getThreadContext(page);
  await page.evaluate(params => window.app.actions!.stepIn(params.cx), { cx: cx });

  await waitForPaused(page, line);
}

export async function stepOutToLine(page: Page, line: number) {
  const cx = await getThreadContext(page);
  await page.evaluate(params => window.app.actions!.stepOut(params.cx), { cx: cx });

  await waitForPaused(page, line);
}

export async function stepOverToLine(page: Page, line: number) {
  const cx = await getThreadContext(page);
  await page.evaluate(params => window.app.actions!.stepOver(params.cx), { cx: cx });

  await waitForPaused(page, line);
}

export async function reverseStepOverToLine(page: Page, line: number) {
  const cx = await getThreadContext(page);
  await page.evaluate(params => window.app.actions!.reverseStepOver(params.cx), { cx: cx });

  await waitForPaused(page, line);
}

export async function selectFrame(page: Page, index: number) {
  page.evaluate(
    params => {
      const frames = app.selectors.getFrames()!;
      return app.actions.selectFrame(app.selectors.getThreadContext(), frames[params.index]);
    },
    { index }
  );
}

export async function waitForFrameTimeline(page: Page, width: string) {
  await page.waitForFunction(
    params => {
      const elem: HTMLElement | null = document.querySelector(".frame-timeline-progress");
      return elem?.style.width == params.width;
    },
    { width }
  );
}

export async function waitForPaused(page: Page, line?: number) {
  await page.evaluate(() =>
    window.app.store.dispatch({ type: "set_selected_primary_panel", panel: "debugger" })
  );

  await page.waitForFunction(
    () => window.app.selectors!.getIsPaused() && window.app.selectors!.getSelectedScope() !== null
  );

  await page.waitForFunction(() => window.app.selectors!.getFrames()!.length > 0);

  if (line) {
    await page.waitForFunction(
      params => {
        const frame = window.app.selectors!.getVisibleSelectedFrame();
        return frame?.location?.line === params.line;
      },
      { line }
    );
  }

  page.locator('.scopes-list .tree-node[aria-level="2"]');
}

export async function checkFrames(page: Page, count: number) {
  return page.waitForFunction(
    params => {
      const frames = app.selectors.getFrames()!;
      return frames.length == params.count;
    },
    { count }
  );
}

export async function waitForScopeValue(page: Page, name: string, value: string) {
  await page.waitForSelector(`.scopes-pane .object-node:has-text("${name}: ${value}")`);
}

export async function reverseStepOver(page: Page) {
  await page.locator('[title="Reverse Step Over"]').click();
  await new Promise(r => setTimeout(r, 100));
  await page.evaluate(() => window.app.selectors!.getIsPaused());
}

export async function stepOver(page: Page) {
  await page.locator('[title="Step Over"]').click();
  await new Promise(r => setTimeout(r, 100));
  await page.evaluate(() => window.app.selectors!.getIsPaused());
}

export async function clickSourceTreeNode(page: Page, node: string) {
  await page.locator(`div[role="tree"] div:has-text("${node}")`).nth(1).click();
}
