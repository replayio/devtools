require("dotenv").config({ path: "./local.env" });

const { firefox } = require("playwright");
const browserSession = require("../session.json");

function sleep() {
  return new Promise(r => setTimeout(r, 100000));
}

async function test() {
  const browser = await firefox.launch({ headless: false, slowMo: 50 });
  const context = await browser.newContext({ storageState: browserSession });
  const page = await context.newPage();

  const url = "https://dashboard.cypress.io/projects/7s5okt/runs";

  await page.goto(url);

  await page.click("a.run-list-item");
  await page.click('[data-cy="test-overview-test-link"]');
  await page.click(".test-results__test-result-title-container");
  // await sleep();

  await browser.close();
}

test();
