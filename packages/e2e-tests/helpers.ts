import { Page, Locator, expect } from "@playwright/test";
const exampleRecordings = require("./examples.json");
import { assert } from "protocol/utils";

type $FixTypeLater = any;

export async function openExample(page: Page, example: string) {
  const recordingId = exampleRecordings[example];
  const base = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:8080";
  await page.goto(`${base}/recording/${recordingId}?e2e=1`);
}

export async function clickDevTools(page: Page) {
  return page.locator("text=DevTools").click();
}

export async function selectConsole(page: Page) {
  return page.locator('button:has-text("Console")').click();
}

export async function togglePausePane(page: Page) {
  return page.locator('button:has-text("motion_photos_paused")').click();
}

// Console

export async function checkEvaluateInTopFrame(page: Page, value: string, expected: string) {
  await page.locator('button:has-text("Console")').click();
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

export async function waitForConsoleMessage(page: Page, message: string) {
  return page.waitForSelector(`.message:has-text('${message}')`);
}

export async function warpToMessage(page: Page, text: string, line?: number) {
  await page.waitForSelector(`.webconsole-output .message:has-text("${text}")`);

  const msg = page.locator(`.webconsole-output .message:has-text("${text}")`);
  await msg.hover();
  const warpButton = msg.locator(".rewind .button") || msg.locator(".fast-forward");

  await warpButton.hover();
  await warpButton.click();

  await waitForPaused(page, line);
}

export async function executeInConsole() {}

export async function checkMessageObjectContents() {}

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

export async function addBreakpoint(
  page: Page,
  url: string,
  line: number,
  column?: number,
  options?: $FixTypeLater
) {
  // const bpCount = dbgSelectors.getBreakpointCount();
  const bpCount = await page.evaluate(() => window.app.selectors!.getBreakpointCount());
  if (options) {
    /*
    const source = await waitForSource(url);
    const sourceId = source!.id;
    await dbgActions.addBreakpoint(
      getContext(),
      { sourceId, line, column, sourceUrl: source!.url! },
      options
    );
    */
  } else {
    // If there are no options, use the default log value for adding new breakpoints,
    // as if the user clicked on the line.
    assert(!column, "column should not bet set if there are no options");
    await selectSource(page, url);

    await page.evaluate(
      params => {
        const cx = app.selectors.getThreadContext();
        app.actions.addBreakpointAtLine(cx, params.line);
      },
      { line }
    );

    await page.waitForFunction(
      async params => {
        const bpCount = window.app.selectors!.getBreakpointCount();
        if (bpCount !== params.bpCount) {
          return false;
        }

        await app.threadFront.waitForInvalidateCommandsToFinish();
      },
      { bpCount: bpCount + 1 }
    );
  }
}

async function selectSource(page: Page, url: string) {
  await page.waitForFunction(params => app.selectors.fuzzyFindSourceByUrl(params.url), { url });

  await page.waitForFunction(
    async params => {
      const source = window.app.selectors!.fuzzyFindSourceByUrl(params.url);
      if (!source) {
        return;
      }
      const cx = window.app.selectors!.getThreadContext();
      return window.app.actions!.selectLocation(cx, { sourceId: source.id }, true);
    },
    {
      url,
    }
  );

  await waitForSelectedSource(page, url);
}

function waitForSelectedSource(page: Page, url?: string) {
  return page.waitForFunction(
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
