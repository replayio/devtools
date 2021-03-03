const { firefox } = require("playwright");

/*
 * Search for "store"
 * Select a couple of results
 */

(async () => {
  const browser = await firefox.launch({
    headless: false,
  });
  const context = await browser.newContext();

  const page = await context.newPage();

  await page.goto("https://vscode-web-test-playground.azurewebsites.net/");

  await page.click('text="Click to Continue"');
  await page.waitForTimeout(8000);

  await page.click('a[aria-label="Search"]');
  await page.waitForTimeout(1000);

  await page.fill(
    'textarea[aria-label="Search: Type Search Term and press Enter to search"]',
    "store"
  );
  await page.waitForTimeout(1000);

  await page.press(
    'textarea[aria-label="Search: Type Search Term and press Enter to search"]',
    "Enter"
  );
  await page.waitForTimeout(1000);

  await page.click(
    "div[aria-label=\"Found 'store' at column 13 in line 'export var storeHouses = [6,13];'\"] >> text=\"store\""
  );

  await page.click("//div[normalize-space(.)='large.ts~/sample-folder25']/div[2]");

  await page.click("//div[normalize-space(.)='large.ts~/sample-folder25']/div[2]");

  await page.click(
    "div[aria-label=\"Found 'store' at column 21 in line '				if (nextSpace==storeHouses[this.turn]) {'\"] >> text=\"store\""
  );
  await page.waitForTimeout(8000);

  await page.close();

  await context.close();
  await browser.close();
})();
