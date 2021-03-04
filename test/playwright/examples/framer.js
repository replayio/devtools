const { chromium } = require("playwright");
const browserSession = require("./framer-session.json");

async function login(page) {
  await Promise.all([
    page.waitForNavigation(/*{ url: 'https://accounts.google.com/o/oauth2/v2/auth/identifier?client_id=494526493439-djlkk2cal7r0lijnrd6en51c9vo4icgp.apps.googleusercontent.com&scope=openid email profile&response_type=code&redirect_uri=https://api.framer.com/auth/google/callback&state=5ed433be-07e7-497e-86d9-04205e0a9a8e&failureRedirect=https://login.framer.com?error=Could%20not%20complete%20authentication&source=framer-web&failureFlash=true&flowName=GeneralOAuthFlow' }*/),
    page.click('text="Continue with Google"'),
  ]);

  await page.fill('input[aria-label="Email or phone"]', "test@replay.io");
  await page.click("//button[normalize-space(.)='Next']/div[2]");
  await page.press('input[aria-label="Enter your password"]', "Enter");
  await page.fill('input[aria-label="Enter your password"]', "ReplayTest123");
  await page.click("//button[normalize-space(.)='Next']/div[2]");
}

(async () => {
  const browser = await chromium.launch({
    headless: false,
  });
  const context = await browser.newContext({ storageState: browserSession });
  const page = await context.newPage();

  if (true) {
    await login(page);
  }
  await page.goto("https://framer.com/projects/f0oJdIOO8ZLQ1iAkKfGX-hvjz5?node=JBLVglfFu-page");

  await Promise.all([
    page.waitForNavigation(/*{ url: 'https://framer.com/projects/f0oJdIOO8ZLQ1iAkKfGX-hvjz5?node=yiLv5hIp2#' }*/),
    page.click('[test-id="layer-name-input"]'),
  ]);

  await context.storageState({ path: "./framer-session.json" });

  await page.waitForTimeout(10000);
  await page.close();

  // ---------------------
  await context.close();
  await browser.close();
})();
