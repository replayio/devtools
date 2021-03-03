const { firefox } = require("playwright");

(async () => {
  const browser = await firefox.launch({
    headless: false,
  });
  const context = await browser.newContext();

  const page = await context.newPage();

  await page.goto("https://www.reddit.com/");

  await page.fill('input[name="q"]', "climate");

  await page.press('input[name="q"]', "Enter");

  // await new Promise(r => {});
  await page.waitForLoadState("networkidle");
  await page.close();

  await context.close();
  await browser.close();
})();
