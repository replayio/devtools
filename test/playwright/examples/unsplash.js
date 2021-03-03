const { firefox } = require("playwright");

(async () => {
  const browser = await firefox.launch({
    headless: false,
  });
  const context = await browser.newContext({});

  const page = await context.newPage();

  await page.goto("https://unsplash.com/");
  await page.click('input[data-test="homepage-header-search-form-input"]');
  await page.fill('input[data-test="homepage-header-search-form-input"]', "trees");
  await page.press('input[data-test="homepage-header-search-form-input"]', "Enter");
  await page.click('img[data-test="photo-grid-multi-col-img"]');
  await page.click("//a[normalize-space(@title)='Next']/*[local-name()=\"svg\"]");
  await page.click("//a[normalize-space(@title)='Next']/*[local-name()=\"svg\"]");
  await page.click("//a[normalize-space(@title)='Next']/*[local-name()=\"svg\"]");
  await page.click('text="Info"');
  await page.close();

  await context.close();
  await browser.close();
})();
