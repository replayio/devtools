const { firefox } = require("playwright");

(async () => {
  const browser = await firefox.launch({
    headless: false,
  });
  const context = await browser.newContext();

  const page = await context.newPage();

  await page.goto("https://www.tablecheck.com/en/japan");

  await page.click('input[placeholder="Area, cuisine or restaurant"]');

  await page.fill('input[placeholder="Area, cuisine or restaurant"]', "tokyo");

  await page.click("//span[normalize-space(.)='Tokyo']");

  await page.click('text="Search"');

  await page.click("//div[3]/div/div[1]/button/span/span[2]/span[normalize-space(.)='Filters']");

  await page.click(
    "//div[normalize-space(@role)='dialog']/div/div[2]/div/div[2]/div/div[normalize-space(.)='¥ 0No Limit']/div[2]"
  );

  await Promise.all([
    page.waitForNavigation(/*{ url: 'https://www.tablecheck.com/en/japan/search?budgetMax=Infinity&budgetMin=10500&datetime=2021-03-04T03:00:00.000Z&distance=2km&lat=35.689722222222&locationText=Tokyo&lon=139.69222222222&people=2&serviceMode=dining' }*/),
    page.click('text="Search"'),
  ]);

  await page.close();

  await context.close();
  await browser.close();
})();
