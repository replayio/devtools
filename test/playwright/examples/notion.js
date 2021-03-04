const { firefox } = require("playwright");

(async () => {
  const browser = await firefox.launch({
    headless: false,
  });
  const context = await browser.newContext();

  const page = await context.newPage();

  await page.goto("https://www.notion.so/replayio/Replay-Docs-56758667f53a4d51b7c6fc7a641adb02");

  await page.click('text="Replay Docs"');

  await page.click("//div[normalize-space(.)='Search' and normalize-space(@role)='button']");

  await page.click('input[placeholder="Search in Replay Docs…"]');

  await page.fill('input[placeholder="Search in Replay Docs…"]', "help");
  await page.waitForTimeout(3000);
  await page.press('input[placeholder="Search in Replay Docs…"]', "Enter");

  await page.waitForTimeout(5000);
  await page.close();

  await context.close();
  await browser.close();
})();
