import { Page } from "@playwright/test";
const exampleRecordings = require("./examples.json");

export async function openExample(page: Page, example: string) {
  const recordingId = exampleRecordings[example];
  await page.goto(`http://localhost:8080/recording/${recordingId}`);
}

export async function clickDevTools(page: Page) {
  return page.locator("text=DevTools").click();
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
  await page.waitForSelector(`.message.result .objectBox:has-text("${message}")`);
}

export async function clearConsoleEvaluations(page: Page) {
  await page.locator("#toolbox-content-console button").nth(1).click();
}

// Debugger

export async function toggleBreakpoint(page: Page, number: number) {
  await page.locator(`text=${number}`).click();
}

export async function rewind(page: Page) {
  await page.locator(".command-bar-button").first().click();
  await new Promise(r => setTimeout(r, 100));
  await page.evaluate(() => window.app.selectors!.getIsPaused());
}

export async function rewindToLine(page: Page, line: number) {
  const cx = await page.evaluate(() => window.app.selectors!.getThreadContext());
  await page.evaluate(params => window.app.actions!.rewind(params.cx), { cx: cx });

  await waitForPaused(page, line);
}

export async function stepInToLine(page: Page, line: number) {
  const cx = await page.evaluate(() => window.app.selectors!.getThreadContext());
  await page.evaluate(params => window.app.actions!.stepIn(params.cx), { cx: cx });

  await waitForPaused(page, line);
}

export async function stepOutToLine(page: Page, line: number) {
  const cx = await page.evaluate(() => window.app.selectors!.getThreadContext());
  await page.evaluate(params => window.app.actions!.stepOut(params.cx), { cx: cx });

  await waitForPaused(page, line);
}

export async function stepOverToLine(page: Page, line: number) {
  const cx = await page.evaluate(() => window.app.selectors!.getThreadContext());
  await page.evaluate(params => window.app.actions!.stepOver(params.cx), { cx: cx });

  await waitForPaused(page, line);
}

export async function reverseStepOverToLine(page: Page, line: number) {
  const cx = await page.evaluate(() => window.app.selectors!.getThreadContext());
  await page.evaluate(params => window.app.actions!.reverseStepOver(params.cx), { cx: cx });

  await waitForPaused(page, line);
}

export async function waitForPaused(page: Page, line: number) {
  await page.evaluate(() =>
    window.app.store.dispatch({ type: "set_selected_primary_panel", panel: "debugger" })
  );

  await page.waitForFunction(
    () => window.app.selectors!.getIsPaused() && window.app.selectors!.getSelectedScope() !== null
  );

  await page.waitForFunction(() => window.app.selectors!.getFrames()!.length > 0);

  await page.waitForFunction(
    params => {
      const frame = window.app.selectors!.getVisibleSelectedFrame();
      return frame?.location?.line === params.line;
    },
    { line }
  );

  page.locator('.scopes-list .tree-node[aria-level="2"]');
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
