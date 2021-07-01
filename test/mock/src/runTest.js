const playwright = require("@recordreplay/playwright");
const fs = require("fs");
require("dotenv").config();

let browserName = process.env.PLAYWRIGHT_CHROMIUM ? "chromium" : "firefox";
const launchOptions = {
  headless: !!process.env.PLAYWRIGHT_HEADLESS,
};

let depth = 0;
const pad = () => "".padStart(depth * 2);
const indent = (value) =>
  String(value)
    .split("\n")
    .map((l) => pad() + l)
    .join("\n");

const log = (...args) => {
  if (depth) {
    console.log(pad().substr(1), ...args);
  } else {
    console.log(...args);
  }
};

function wrapped(cbk, pageLog = log, inline = false) {
  const i = inline ? 0 : 1;
  return async (name, ...args) => {
    try {
      await pageLog(inline ? name : `> ${name}`);
      depth += i;
      return await cbk(...args);
    } catch (e) {
      if (!e.handled) {
        e.handled = true;
        console.error(indent(`🛑 Error in ${name}\n`));
        console.error(indent(e.stack));
      }

      throw e;
    } finally {
      depth -= i;
      if (!inline) await pageLog(`< ${name}`);
    }
  };
}

function bindPageActions(page) {
  const actions = {};

  // Create page-bound actions
  const pageLog = (...args) => {
    log(...args);
    return page.evaluate((extArgs) => {
      console.log("Test Step:", ...extArgs);
    }, args);
  };

  const pageAction = wrapped(async (cbk) => await cbk(page, actions), pageLog);
  const pageStep = wrapped(
    async (cbk) => await cbk(page, actions),
    pageLog,
    true
  );

  actions.log = pageLog;
  actions.action = pageAction;
  actions.step = pageStep;

  return actions;
}

const action = wrapped(async (cbk) => await cbk());

const runTest = wrapped(async (cbk) => {
  const browser = await playwright[browserName].launch(launchOptions);
  const context = await browser.newContext();
  const page = await context.newPage();
  const startTime = new Date();
  const pageLog = (...args) => {
    log(...args);
    page.evaluate((extArgs) => {
      console.log("Test Step:", ...extArgs);
    }, args).catch(e => {});
  };

  pageLog("Browser launched");
  let success = true;

  await action("Running example", async () => {
    try {
      await cbk(page, bindPageActions(page));
    } catch (e) {
      success = false;
      console.error(e);
    }
    pageLog(`Test ${success ? "succeeded" : "failed"}`);
  });

  // Adding a short delay after the script to allow space for trailing script
  // execution
  await page.waitForTimeout(100);

  await page.close();
  await context.close();
  await browser.close();
});

function devtoolsURL({ id }) {
  let url = "http://localhost:8080/view?mock=1";
  if (id) {
    url += `&id=${id}`;
  }
  return url;
}

module.exports = { runTest, devtoolsURL };
