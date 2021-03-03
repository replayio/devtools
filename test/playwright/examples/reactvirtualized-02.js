const { firefox } = require("playwright");

/*
 * Scroll down via arrow down trick
 */

(async () => {
  const browser = await firefox.launch({
    headless: false,
  });
  const context = await browser.newContext();

  const page = await context.newPage();

  await page.goto("https://bvaughn.github.io/react-virtualized/#/components/List");

  await page.click('text="Peter Brimer"');

  for (let i = 0; i < 200; i++) {
    await page.press(".ReactVirtualized__Grid__innerScrollContainer", "ArrowDown");
    await page.waitForTimeout(200);
  }

  await page.close();

  await context.close();
  await browser.close();
})();
