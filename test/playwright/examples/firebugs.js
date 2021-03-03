const { firefox } = require("playwright");

(async () => {
  const browser = await firefox.launch({
    headless: false,
  });
  const context = await browser.newContext();

  const page = await context.newPage();

  await page.goto("https://firebugs.dev/");

  await page.goto("https://firebugs.dev/#bugs/DevTools/Debugger");

  await page.click('input[placeholder="Search..."]');

  await Promise.all([
    page.waitForNavigation(/*{ url: 'https://firebugs.dev/#bugs/DevTools/Debugger' }*/),
    page.fill('input[placeholder="Search..."]', "break"),
  ]);

  await page.click('text="-"');

  await page.click('text="Bug"');

  await page.click('text="Priority"');

  await page.click('div[role="menuitem"]');

  await page.click('text="Keyword"');

  await page.click('text="-"');

  await page.click('text="Keyword"');

  await context.close();
  await browser.close();
})();
