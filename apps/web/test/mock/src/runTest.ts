import playwright, { Page } from "@recordreplay/playwright";
import dotenv from "dotenv";

dotenv.config();

type BrowserName = "chromium" | "firefox";
let browserName: BrowserName = process.env.PLAYWRIGHT_CHROMIUM ? "chromium" : "firefox";
const launchOptions = {
  executablePath: process.env.RECORD_REPLAY_PATH,
  headless: !!process.env.PLAYWRIGHT_HEADLESS,
};

let depth = 0;
const pad = () => "".padStart(depth * 2);
const indent = (value: any) =>
  String(value)
    .split("\n")
    .map(l => pad() + l)
    .join("\n");

const log = (...args: any[]) => {
  if (depth) {
    console.log(pad().substr(1), ...args);
  } else {
    console.log(...args);
  }
};

function wrapped<T>(cbk: (...args: any[]) => Promise<T>, pageLog = log, inline = false) {
  const i = inline ? 0 : 1;
  return async (name: string, ...args: any[]) => {
    try {
      await pageLog(inline ? name : `> ${name}`);
      depth += i;
      return await cbk(...args);
    } catch (e: any) {
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

function bindPageActions(page: Page) {
  const actions: any = {};

  // Create page-bound actions
  const pageLog = (...args: any[]) => {
    log(...args);
    return page.evaluate((extArgs: any) => {
      console.log("Test Step:", ...extArgs);
    }, args);
  };

  const pageAction = wrapped(async cbk => await cbk(page, actions), pageLog);
  const pageStep = wrapped(async cbk => await cbk(page, actions), pageLog, true);

  actions.log = pageLog;
  actions.action = pageAction;
  actions.step = pageStep;

  return actions;
}

const action = wrapped(async cbk => await cbk());

export const runTest = wrapped(async cbk => {
  const browser = await playwright[browserName].launch(launchOptions);
  const context = await browser.newContext();
  const page = await context.newPage();
  const pageLog = (...args: string[]) => {
    log(...args);
    page
      .evaluate(extArgs => {
        console.log("Test Step:", ...extArgs);
      }, args)
      .catch(e => {});
  };

  pageLog("Browser launched");
  let success = true;

  page.on("console", console.log);

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

  process.exit(success ? 0 : 1);
});

export function devtoolsURL({ id }: { id: string }) {
  let url = (process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:8080") + "/";
  if (id) {
    url += `recording/${id}/`;
  }
  url += "?mock=1";
  return url;
}

export function waitForTime(ms: number, waitingFor: string) {
  console.log(`waiting ${ms}ms for ${waitingFor}`);
  return new Promise(resolve => setTimeout(resolve, ms));
}

const WaitTimeout = 1000 * 10;

async function waitUntil(fn: () => any, options: { timeout?: number; waitingFor?: string }) {
  const { timeout, waitingFor } = { timeout: WaitTimeout, waitingFor: "unknown", ...options };
  const start = Date.now();
  while (true) {
    const rv = fn();
    if (rv) {
      return rv;
    }
    const elapsed = Date.now() - start;
    if (elapsed >= timeout) {
      break;
    }
    if (elapsed < 1000) {
      await waitForTime(50, waitingFor);
    } else if (elapsed < 5000) {
      await waitForTime(200, waitingFor);
    } else {
      await waitForTime(1000, waitingFor);
    }
  }
  throw new Error(`waitUntil() timed out waiting for ${waitingFor}`);
}
