const { firefox } = require("playwright");

(async () => {
  const browser = await firefox.launch({
    headless: false,
  });
  const context = await browser.newContext();

  const page = await context.newPage();

  await page.goto("https://www.nytimes.com/");

  await page.click(
    'div[data-testid="masthead-mini-nav"] li[data-testid="mini-nav-item"] >> text="World"'
  );

  await page.click('button[data-test-id="search-button"]');

  await page.fill('input[data-testid="search-input"]', "climate");

  await page.press('input[data-testid="search-input"]', "Enter");

  await page.close();

  await context.close();
  await browser.close();
})();
