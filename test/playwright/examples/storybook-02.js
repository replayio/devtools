const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({
    headless: false,
  });
  const context = await browser.newContext();

  const page = await context.newPage();

  await page.goto(
    "https://5ccbc373887ca40020446347-qbeeoghter.chromatic.com/?path=/story/avatar--large"
  );

  await page.click('text="Small"');

  await page.click('text="CodeSnippets"');

  await page.click('text="Multiple"');

  await page.click("//button[normalize-space(.)='Actions' and normalize-space(@role)='tab']");

  await page.click("//button[normalize-space(.)='Story' and normalize-space(@role)='tab']");

  await page.close();

  await context.close();
  await browser.close();
})();
