const { firefox } = require("playwright");

(async () => {
  const browser = await firefox.launch({
    headless: false,
  });
  const context = await browser.newContext();

  const page = await context.newPage();

  await page.goto("https://climatescape.org/");

  await page.click('text="Organizations"');

  await page.click('text="Buildings & Cities"');

  await page.click('text="HQ Location"');

  await page.click('text="Australia"');

  await page.click("text=/.*It uses the Internet of Things.*/");

  await page.click('text="Energy Efficiency"');

  await page.close();

  await context.close();
  await browser.close();
})();
