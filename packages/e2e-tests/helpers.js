const exampleRecordings = require("./examples.json");

async function openExample(page, example) {
  const recordingId = exampleRecordings[example];
  await page.goto(`http://localhost:8080/recording/${recordingId}`);
}

async function clickDevTools(page) {
  return page.locator("text=DevTools").click();
}

async function togglePausePane(page) {
  return page.locator('button:has-text("motion_photos_paused")').click();
}

// Console

async function evaluateInConsole(page, value) {
  await page.locator('button:has-text("Console")').click();
  return page.evaluate(
    async params => {
      window.jsterm.setValue(params.value);
      await new Promise(r => setTimeout(r, 10));
      window.jsterm.execute();
    },
    { value }
  );
}

async function waitForConsoleMessage(page, message) {
  await page.waitForSelector(`.message.result .objectBox:has-text("${message}")`);
}

async function clearConsoleEvaluations(page) {
  await page.locator("#toolbox-content-console button").nth(1).click();
}

// Debugger

async function toggleBreakpoint(page, number) {
  await page.locator(`text=${number}`).click();
}

async function resume(page) {
  await page.locator(".command-bar-button").first().click();
  await new Promise(r => setTimeout(r, 100));
  await page.evaluate(() => window.app.selectors.getIsPaused());
}

async function reverseStepOver(page) {
  await page.locator('[title="Reverse Step Over"]').click();
  await new Promise(r => setTimeout(r, 100));
  await page.evaluate(() => window.app.selectors.getIsPaused());
}

async function stepOver(page) {
  await page.locator('[title="Step Over"]').click();
  await new Promise(r => setTimeout(r, 100));
  await page.evaluate(() => window.app.selectors.getIsPaused());
}

async function clickSourceTreeNode(page, node) {
  await page.locator(`div[role="tree"] div:has-text("${node}")`).nth(1).click();
}

module.exports = {
  clickDevTools,
  openExample,
  togglePausePane,

  // Console
  clearConsoleEvaluations,
  evaluateInConsole,
  waitForConsoleMessage,

  // Debugger
  clickSourceTreeNode,
  resume,
  reverseStepOver,
  stepOver,
  toggleBreakpoint,
};
