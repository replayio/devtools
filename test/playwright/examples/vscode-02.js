const { firefox } = require("playwright");

/*
 * Select a couple of files from the source explorer
 * First two files are clicks
 * Next two files are double clicks
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

  await page.click(
    "//div[normalize-space(.)='file.css' and normalize-space(@title)='~/sample-folder/file.css']"
  );
  await page.waitForTimeout(1000);

  await page.click(
    "//div[normalize-space(.)='file.html' and normalize-space(@title)='~/sample-folder/file.html']"
  );
  await page.waitForTimeout(1000);

  await page.dblclick(
    "//div[normalize-space(.)='file.js' and normalize-space(@title)='~/sample-folder/file.js']"
  );

  await page.waitForTimeout(1000);
  await page.dblclick(
    "//div[normalize-space(.)='file.md' and normalize-space(@title)='~/sample-folder/file.md']"
  );

  await page.waitForTimeout(5000);
  await page.close();

  await context.close();
  await browser.close();
})();
