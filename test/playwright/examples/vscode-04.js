const { firefox } = require("playwright");

/*
 * Open VS Code and create a new file
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
  await page.click('div[aria-label="Application Menu"] div[role="none"]');
  await page.click('span[aria-label="File"]');
  await page.waitForTimeout(1000);
  await page.click('span[aria-label="New File"]');
  await page.fill('textarea[aria-label="Untitled-1"]', "sdf");
  await page.press('textarea[aria-label="Untitled-1"]', "Meta+s");
  await page.fill('input[aria-label="Type to narrow down results."]', "/sample-folder/sdf");
  await page.press('input[aria-label="Type to narrow down results."]', "ArrowRight");
  await page.fill('input[aria-label="Type to narrow down results."]', "/sample-folder/sdf.js");
  await page.press('input[aria-label="Type to narrow down results."]', "Enter");
  await page.waitForTimeout(5000);

  await context.close();
  await browser.close();
})();
