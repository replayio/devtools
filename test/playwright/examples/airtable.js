const { chromium } = require("playwright");
const browserSession = require("./airtable-session.json");

async function login(page) {
  await page.click('text="Sign in with Google"');
  await page.click('input[aria-label="Email or phone"]');
  await page.fill('input[aria-label="Email or phone"]', "test@replay.io");
  await page.click("//button[normalize-space(.)='Next']/div[2]");
  await page.press('input[aria-label="Enter your password"]', "Enter");
  await page.fill('input[aria-label="Enter your password"]', "ReplayTest123");
  await page.click("//button[normalize-space(.)='Next']/div[2]");

  await Promise.all([
    page.waitForNavigation(/*{ url: 'https://airtable.com/tblyhHslxp7TfMogc/viwj1iaRkCjrzVOAf?blocks=hide' }*/),
    page.click("//button[normalize-space(.)='Allow']/div[2]"),
  ]);
}

(async () => {
  const browser = await chromium.launch({
    headless: false,
  });
  const context = await browser.newContext({ storageState: browserSession });
  const page = await context.newPage();

  await page.goto("https://airtable.com/tbl2B9XDcGl90oG58/viwA7GIBsYINpwH0O?blocks=hide");

  if (true) {
    await login(page);
  }

  await context.storageState({ path: "./airtable-session.json" });
  await page.waitForTimeout(100000);

  await page.close();

  await context.close();
  await browser.close();
})();
