const { firefox } = require("playwright");

/*
 * Open VS Code
 */

(async () => {
  const browser = await firefox.launch({
    headless: false,
  });
  const context = await browser.newContext();

  const page = await context.newPage();

  await page.goto("https://vscode-web-test-playground.azurewebsites.net/");

  await page.click('text="Click to Continue"');

  await page.waitForTimeout(8000);

  await context.close();
  await browser.close();
})();
