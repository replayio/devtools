//@ts-check

require("dotenv").config({ path: "./local.env" });

const { firefox } = require("playwright");
const browserSession = require("../session.json");
const arg = require("arg");

async function login(page, context) {
  await page.fill("#email", "test@replay.io");
  await page.fill("#pass", "replay123");
  await page.click('[type="submit"]');
  await context.storageState({ path: "./session.json" });
}

async function visitMarketPlace(page) {
  try {
    await page.goto("https://www.facebook.com/marketplace");
  } catch (e) {}
  // await hoverRandomly(page, 20);

  let elements = await page.$$eval("img", els =>
    els.map(el => JSON.stringify(el.getBoundingClientRect()))
  );

  console.log(elements);
  elements = elements.map(el => JSON.parse(el));

  const el = elements.find(el => el.width == 273);
  console.log(el);

  await page.mouse.click(el.x + el.width / 2, el.y + el.height / 2);
  await scroll(page);
  await hoverRandomly(page);
}

async function visitHomepage(page) {
  await page.goto("http://facebook.com/");

  await scroll(page);
}

function sleep() {
  return new Promise(r => setTimeout(r, 100000));
}

async function hoverRandomly(page, limit = 10) {
  const x = Math.random() * 1000;
  const y = Math.random() * 1000;
  for (var i = 0; i <= limit; i++) {
    await page.mouse.move(x, y, { steps: 10 });
  }
}

async function scroll(page) {
  for (var i = 0; i <= 100; i++) {
    try {
      await page.keyboard.down("ArrowDown");
    } catch (e) {
      console.error(e);
    }
  }
}

async function test(destination) {
  const browser = await firefox.launch({ headless: false, slowMo: 50 });
  const context = await browser.newContext({ storageState: browserSession });
  const page = await context.newPage();

  if (!destination) {
    await visitHomepage(page);
    await visitMarketPlace(page);
  }

  try {
    switch (destination) {
      case "homepage":
        await visitHomepage(page);
        break;
      case "marketplace":
        await visitMarketPlace(page);
        break;
      case "login":
        await login(page, context);
      default:
        break;
    }
  } catch (e) {}

  await browser.close();
}

const args = arg({
  "--destination": String,
});

test(args["--destination"]);
