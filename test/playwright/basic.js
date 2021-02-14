// Playwright script for inspecting a simple recording.
// This test is currently experimental.

const playwright = require('playwright');

(async () => {
  const browser = await playwright.firefox.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://replay.io/view?id=053e7a46-c023-4843-8787-9b0254c077bf");
  await switchToDevtools(page);
  await selectSource(page, "doc_rr_basic.html");

  // We have to hover and check for breakpoint hits first. Clicking on the
  // breakpoint element first leads to the logpoint being cleared out by the
  // devtools hover logic that runs afterwards.
  //
  // There is a second problem where playwight sometimes hover/clicks on line 19
  // instead of line 20. If it hovers on line 19 and then clicks on line 20 then
  // the test will not finish.
  await checkBreakpointHits(page, 20, 10);

  await addBreakpoint(page, 20);
  await waitForMessageCount(page, "updateNumber", 10);
  await updateBreakpoint(page, "updateNumber", '"hello", number');
  await jumpToMessage(page, "hello 7");
  await selectPauseToolbar(page);
  await waitForScopeNode(page, "<this>: Window");
  await evaluateInConsole(page, "number * 6");
  await waitForMessageCount(page, "42", 1);

  await browser.close();
})();

async function switchToDevtools(page) {
  await page.click("text=devtools");
}

async function selectSource(page, url) {
  await page.click("text=go to file");
  await page.fill(".search-field input", url);
  await page.press(".search-field input", "Enter");
}

async function checkBreakpointHits(page, line, count) {
  await page.hover(`.CodeMirror-linenumber:text("${line}")`);
  await page.waitForSelector(`.static-tooltip:text("${count} hits")`);
}

async function addBreakpoint(page, line) {
  await page.click(`.CodeMirror-linenumber:text("${line}")`);
}

async function waitForMessageCount(page, text, count) {
  await waitUntil(async () => {
    const messages = await page.$$(".message-body");
    let matchCount = 0;
    for (const msg of messages) {
      const innerText = await msg.innerText();
      if (innerText.includes(text)) {
        matchCount++;
      }
    }
    return matchCount == count;
  });
}

async function jumpToMessage(page, text) {
  const msg = await waitUntil(async () => {
    const messages = await page.$$(".message");
    for (const msg of messages) {
      const innerText = await msg.innerText();
      if (innerText.includes(text)) {
        return msg;
      }
    }
    return null;
  });

  await msg.hover();

  const button = await msg.$(".overlay-container");
  await button.dispatchEvent("click");
}

async function updateBreakpoint(page, existingText, newText) {
  await page.dispatchEvent(`button:has(span:text("${existingText}"))`, "click");
  await waitForTime(200);

  await page.keyboard.press("Meta+A");
  await page.keyboard.press("Delete");
  await page.keyboard.type(newText);
  await page.keyboard.press("Enter");
}

async function selectPauseToolbar(page) {
  // The pause toolbar button doesn't have anything to distinguish it from other toolbar buttons.
  const buttons = await page.$$("#toolbox-toolbar button");
  await buttons[2].dispatchEvent("click");
}

async function waitForScopeNode(page, text) {
  return waitUntil(async () => {
    const nodes = await page.$$(".tree-node");
    for (const node of nodes) {
      const innerText = await node.innerText();
      if (innerText.replaceAll("\n", "").includes(text)) {
        return node;
      }
    }
    return null;
  });
}

async function evaluateInConsole(page, text) {
  await page.dispatchEvent(".jsterm-input-container .CodeMirror-scroll", "mousedown");
  await waitForTime(200);

  await page.keyboard.type(text);
  await page.keyboard.press("Enter");
}

function waitForTime(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitUntil(predicate) {
  while (true) {
    const rv = await predicate();
    if (rv) {
      return rv;
    }
    await waitForTime(100);
  }
}
