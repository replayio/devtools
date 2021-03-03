const { firefox } = require("playwright");

(async () => {
  const browser = await firefox.launch({
    headless: false,
  });
  const context = await browser.newContext();

  const page = await context.newPage();

  await page.goto("https://codesandbox.io/s/0d68e?file=/src/App.js");

  await page.click('text="index.js"');

  await page.goto("https://codesandbox.io/s/0d68e?file=/src/index.js");

  await page.close();

  await context.close();
  await browser.close();
})();
