const { firefox } = require("playwright");

(async () => {
  const browser = await firefox.launch({
    headless: false,
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://www.airbnb.com/");
  await page.click('input[data-testid="structured-search-input-field-query"]');
  await page.fill('input[data-testid="structured-search-input-field-query"]', "tahoe");
  await page.press('input[data-testid="structured-search-input-field-query"]', "Enter");
  await page.click("//button[normalize-space(.)='Search']/span[1]/span");
  await page.click("//button[normalize-space(.)='PricePrice']");
  await page.click("//div[31]");
  await page.close();
  await context.close();
  await browser.close();
})();
