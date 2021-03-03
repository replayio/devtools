const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({
    headless: false,
  });
  const context = await browser.newContext();

  // Open new page
  const page = await context.newPage();

  // Go to https://microsoft.github.io/monaco-editor/playground.html
  await page.goto("https://microsoft.github.io/monaco-editor/playground.html");

  // Click //div[normalize-space(.)='    language: "javascript"']
  await page.click("//div[normalize-space(.)='    language: \"javascript\"']");

  // Press ArrowUp
  await page.press(
    'textarea[aria-label="Editor content;Press Alt+F1 for Accessibility Options."]',
    "ArrowUp"
  );

  // Press ArrowRight with modifiers
  await page.press(
    'textarea[aria-label="Editor content;Press Alt+F1 for Accessibility Options."]',
    "Meta+ArrowRight"
  );

  // Press ArrowLeft
  await page.press(
    'textarea[aria-label="Editor content;Press Alt+F1 for Accessibility Options."]',
    "ArrowLeft"
  );

  // Press ArrowLeft
  await page.press(
    'textarea[aria-label="Editor content;Press Alt+F1 for Accessibility Options."]',
    "ArrowLeft"
  );

  await page.fill(
    'textarea[aria-label="Editor content;Press Alt+F1 for Accessibility Options."]',
    ``
  );

  // Fill textarea[aria-label="Editor content;Press Alt+F1 for Accessibility Options."]
  await page.type(
    'textarea[aria-label="Editor content;Press Alt+F1 for Accessibility Options."]',
    `
// The Monaco Editor can be easily created, given an
// empty container and an options literal.
// Two members of the literal are "value" and "language".
// The editor takes the full size of its container.

monaco.editor.create(document.getElementById("container"), {
value: "function hello() {alert('Hello world!');}",
language: "javascript"
`
  );

  await page.press(
    'textarea[aria-label="Editor content;Press Alt+F1 for Accessibility Options."]',
    "ArrowUp"
  );

  await page.press(
    'textarea[aria-label="Editor content;Press Alt+F1 for Accessibility Options."]',
    "ArrowUp"
  );

  // Click button[aria-label="Press CMD + return to run the code."]
  await page.click('button[aria-label="Press CMD + return to run the code."]');

  await new Promise(r => {});
  // Close page
  await page.close();

  // ---------------------
  await context.close();
  await browser.close();
})();
