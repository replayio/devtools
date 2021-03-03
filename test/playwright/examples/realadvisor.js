const { firefox } = require("playwright");

(async () => {
  const browser = await firefox.launch({
    headless: false,
  });
  const context = await browser.newContext();

  const page = await context.newPage();

  await page.goto("https://realadvisor.ch/");

  await page.click('input[placeholder="Enter your address..."]');

  await page.click("//span[normalize-space(.)='Buy']");

  await page.goto("https://realadvisor.ch/en/property-for-sale");

  await Promise.all([
    page.waitForNavigation(/*{ url: 'https://realadvisor.ch/en/buy/house-apartment' }*/),
    page.click('text="Search"'),
  ]);

  await page.goto("https://realadvisor.ch/en/buy/house-apartment");

  await Promise.all([
    page.waitForNavigation(/*{ url: 'https://realadvisor.ch/en/rent/house-apartment' }*/),
    page.click(
      "//div[1]/div[normalize-space(@role)='group']/button[2]/span[1][normalize-space(.)='Rent']"
    ),
  ]);

  await page.click('text="Our recommendations"');

  await Promise.all([
    page.waitForNavigation(/*{ url: 'https://realadvisor.ch/en/rent/house-apartment?sortBy="createdAt"&sortDirection="DESC"' }*/),
    page.click('text="Most recent"'),
  ]);

  await page.close();

  await context.close();
  await browser.close();
})();
