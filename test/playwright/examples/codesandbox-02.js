const { firefox } = require("playwright");

/*
 * Search for useState
 */

(async () => {
  const browser = await firefox.launch({
    headless: false,
  });
  const context = await browser.newContext();

  const page = await context.newPage();

  await page.goto("https://codesandbox.io/s/0d68e?file=/src/App.js");

  await page.click('button[aria-label="Search"]');

  await page.click('input[placeholder="Search"]');

  await page.fill('input[placeholder="Search"]', "usest");

  await page.click("//span[normalize-space(.)='import { useState } from \"react\";']");

  await page.goto("https://codesandbox.io/s/0d68e?file=/src/App.js:36-41");

  await page.close();

  await context.close();
  await browser.close();
})();
