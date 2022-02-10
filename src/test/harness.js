// Harness for use by automated tests. Adapted from various test devtools
// test harnesses.

const { sendMessage } = require("protocol/socket");
const { ThreadFront } = require("protocol/thread");
const { assert } = require("protocol/utils");
const mapValues = require("lodash/mapValues");
const isEqual = require("lodash/isEqual");

const dbg = gToolbox.getPanel("debugger").getVarsForTests();

export function waitForTime(ms, waitingFor) {
  console.log(`waiting ${ms}ms for ${waitingFor}`);
  return new Promise(resolve => setTimeout(resolve, ms));
}

const dbgSelectors = {};
for (const [name, method] of Object.entries(dbg.selectors)) {
  dbgSelectors[name] = (...args) => method(dbg.store.getState(), ...args);
}

function waitForElapsedTime(time, ms) {
  const wait = time + ms - Date.now();
  if (wait > 0) {
    return waitForTime(wait, `time to reach ${time}`);
  }
}

const WaitTimeout = 1000 * 10;

export async function waitUntil(fn, options) {
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

function start() {
  app.actions.setViewMode("dev");
  return waitUntil(() => isFullyLoaded() && app.selectors.getViewMode() == "dev", {
    timeout: 1000 * 120,
    waitingFor: "the page to load",
  });
}

function finish() {
  console.log("TestFinished", { success: true });
  localStorage.clear();
}

function isFullyLoaded() {
  const loadedRegions = app.selectors.getLoadedRegions();
  return (
    loadedRegions &&
    loadedRegions.loading.length > 0 &&
    loadedRegions.loaded.length > 0 &&
    loadedRegions.loading[0].end.point === loadedRegions.loaded[0].end.point
  );
}

async function clickElement(selector) {
  const element = await waitUntil(() => document.querySelector(selector), {
    waitingFor: `${selector} to appear`,
  });
  if (!element) {
    console.log(`Could not find element with selector ${selector}`);
  }
  return element.click();
}

function selectConsole() {
  return clickElement("button.console-panel-button");
}

function selectDebugger() {
  return gToolbox.selectTool("debugger");
}

async function selectInspector() {
  await clickElement("button.inspector-panel-button");
  // ensure that the inspector is fully initialized, including its legacy
  // components.
  await waitUntil(() => document.querySelector(".inspector ul.children"), {
    waitingFor: "inspector to initialize",
  });
}

const selectReactDevTools = async () => clickElement("button.components-panel-button");
const getContext = () => dbgSelectors.getContext();
const getThreadContext = () => dbgSelectors.getThreadContext();

function findSource(url) {
  if (typeof url !== "string") {
    // Support passing in a source object itelf all APIs that use this function
    // support both styles
    return url;
  }

  const sources = dbgSelectors.getSourceList();
  return sources.find(s => (s.url || "").includes(url));
}

function waitForSource(url) {
  return waitUntil(() => findSource(url), { waitingFor: `source: ${url} to be present` });
}

function countSources(url) {
  const sources = dbgSelectors.getSourceList();
  return sources.filter(s => (s.url || "").includes(url)).length;
}

function waitForSourceCount(url, count) {
  return waitUntil(() => countSources(url) === count, {
    waitingFor: `${count} source to be present`,
  });
}

async function selectSource(url) {
  const source = await waitForSource(url);
  await dbg.actions.selectLocation(getContext(), { sourceId: source.id }, { keepContext: false });
  return waitForSelectedSource(url);
}

async function addLogpoint(url, line) {
  const lpCount = dbgSelectors.getLogpointCount();

  await selectSource(url);
  await dbg.actions.addLogpoint(getContext(), line);

  await waitUntil(
    () => {
      return dbgSelectors.getLogpointCount() == lpCount + 1;
    },
    { waitingFor: "logpoint to be set" }
  );
  await ThreadFront.waitForInvalidateCommandsToFinish();
}

async function addBreakpoint(url, line, column, options) {
  const bpCount = dbgSelectors.getBreakpointCount();

  if (options) {
    const source = await waitForSource(url);
    const sourceId = source.id;
    await dbg.actions.addBreakpoint(getContext(), { sourceId, line, column }, options);
  } else {
    // If there are no options, use the default log value for adding new breakpoints,
    // as if the user clicked on the line.
    assert(!column);
    await selectSource(url);
    await dbg.actions.addBreakpointAtLine(getContext(), line);
  }

  await waitUntil(
    () => {
      return dbgSelectors.getBreakpointCount() == bpCount + 1;
    },
    { waitingFor: "breakpoint to be set" }
  );
  await ThreadFront.waitForInvalidateCommandsToFinish();
}

async function setBreakpointOptions(url, line, column, options) {
  const source = await waitForSource(url);
  const sourceId = source.id;
  column = column || getFirstBreakpointColumn(line, sourceId);
  await dbg.actions.addBreakpoint(getContext(), { sourceId, line, column }, options);
  await ThreadFront.waitForInvalidateCommandsToFinish();
}

async function disableBreakpoint(url, line, column) {
  const source = await waitForSource(url);
  const sourceId = source.id;
  column = column || getFirstBreakpointColumn(line, sourceId);
  const location = { sourceId, sourceUrl: source.url, line, column };
  const bp = dbgSelectors.getBreakpointForLocation(location);
  await dbg.actions.disableBreakpoint(getContext(), bp);
  await ThreadFront.waitForInvalidateCommandsToFinish();
}

function getFirstBreakpointColumn(line, sourceId) {
  const source = dbgSelectors.getSource(sourceId);
  const position = dbgSelectors.getFirstBreakpointPosition({ line, sourceId });
  return position.column;
}

async function removeAllBreakpoints() {
  await dbg.actions.removeAllBreakpoints(getContext());
  await ThreadFront.waitForInvalidateCommandsToFinish();
}

async function unloadRegion(begin, end) {
  await sendMessage("Session.unloadRegion", { region: { begin, end } }, ThreadFront.sessionId);
}
async function loadRegion(begin, end, timeout) {
  await sendMessage("Session.loadRegion", { region: { begin, end } }, ThreadFront.sessionId);
}

function isPaused() {
  return dbgSelectors.getIsPaused();
}

async function waitForLoadedScopes() {
  // Since scopes auto-expand, we can assume they are loaded when there is a tree node
  // with the aria-level attribute equal to "2".
  await waitUntil(() => document.querySelector('.scopes-list .tree-node[aria-level="2"]'));
  await waitUntil(() => document.querySelector('.scopes-list .tree-node[aria-level="2"]'), {
    waitingFor: "scopes to be loaded (via tree node)",
  });
}

function waitForSelectedSource(url) {
  const { getSelectedSourceWithContent, hasSymbols, getBreakableLines } = dbgSelectors;

  return waitUntil(
    () => {
      const source = getSelectedSourceWithContent() || {};
      if (!source.content) {
        return false;
      }

      if (!url) {
        return true;
      }

      const newSource = findSource(url);
      if (newSource.id != source.id) {
        return false;
      }

      // The hasSymbols check is disabled. Sometimes the parser worker fails for
      // unclear reasons. See https://github.com/RecordReplay/devtools/issues/433
      // return hasSymbols(source) && getBreakableLines(source.id);
      return getBreakableLines(source.id);
    },
    { waitingFor: `source ${url} to be selected` }
  );
}

async function waitForPaused(url) {
  const { getSelectedScope, getFrames } = dbgSelectors;
  // Make sure that the debug primary panel is selected so that the test can
  // interact with the pause navigation and info.
  store.dispatch({ type: "set_selected_primary_panel", panel: "debugger" });
  await waitUntil(() => isPaused() && !!getSelectedScope(), { waitingFor: "execution to pause" });
  await waitUntil(() => getFrames(), { waitingFor: "frames to populate" });
  await waitForLoadedScopes();
  await waitForSelectedSource(url);
}

async function waitForPausedNoSource() {
  // Make sure that the debug primary panel is selected so that the test can
  // interact with the pause navigation and info.
  store.dispatch({ type: "set_selected_primary_panel", panel: "debug" });

  await waitUntil(() => isPaused(), { waitingFor: "execution to pause" });
}

function hasFrames() {
  const frames = dbgSelectors.getFrames();
  return frames.length > 0;
}

function getVisibleSelectedFrameLine() {
  const frame = dbgSelectors.getVisibleSelectedFrame();
  return frame && frame.location.line;
}

async function waitForPausedLine(line) {
  await waitUntil(() => line == getVisibleSelectedFrameLine(), {
    waitingFor: `line ${line} to paused`,
  });
}

function resumeThenPauseAtLineFunctionFactory(method) {
  return async function (line) {
    await dbg.actions[method](getThreadContext());
    if (line !== undefined) {
      await waitForPaused();
    } else {
      await waitForPausedNoSource();
    }
    await waitForPausedLine(line);
  };
}

// Define various methods that resume a thread in a specific way and ensure it
// pauses at a specified line.
const rewindToLine = resumeThenPauseAtLineFunctionFactory("rewind");
const resumeToLine = resumeThenPauseAtLineFunctionFactory("resume");
const reverseStepOverToLine = resumeThenPauseAtLineFunctionFactory("reverseStepOver");
const stepOverToLine = resumeThenPauseAtLineFunctionFactory("stepOver");
const stepInToLine = resumeThenPauseAtLineFunctionFactory("stepIn");
const stepOutToLine = resumeThenPauseAtLineFunctionFactory("stepOut");

function resumeAndPauseFunctionFactory(method) {
  return async function (lineno, waitForLine) {
    await dbg.actions[method](getThreadContext());
    await waitForPausedNoSource();
  };
}

const reverseStepOverAndPause = resumeAndPauseFunctionFactory("reverseStepOver");
const stepOverAndPause = resumeAndPauseFunctionFactory("stepOver");
const stepInAndPause = resumeAndPauseFunctionFactory("stepIn");
const stepOutAndPause = resumeAndPauseFunctionFactory("stepOut");

async function checkEvaluateInTopFrame(text, expected) {
  selectConsole();
  await executeInConsole(text);

  await waitUntil(
    () => {
      const node = document.querySelector(".message.result .objectBox");
      return node?.innerText == `${expected}`;
    },
    { waitingFor: `message with text "${expected}"` }
  );

  await clickElement(".devtools-clear-icon");
  selectDebugger();
}

async function waitForScopeValue(name, value) {
  const expected = value !== undefined ? `${name}\n: \n${value}` : name;
  return waitUntil(
    () => {
      const nodes = document.querySelectorAll(".scopes-pane .object-node");
      return [...nodes].some(node => node.innerText == expected);
    },
    { waitingFor: `scope "${value}" to be present` }
  );
}

async function toggleBlackboxSelectedSource() {
  const { getSelectedSource } = dbgSelectors;
  const blackboxed = getSelectedSource().isBlackBoxed;
  dbg.actions.toggleBlackBox(getContext(), getSelectedSource());
  await waitUntil(() => getSelectedSource().isBlackBoxed != blackboxed, {
    waitingFor: "source to be blackboxed",
  });
  await ThreadFront.waitForInvalidateCommandsToFinish();
}

function findMessages(text, extraSelector = "") {
  const messages = document.querySelectorAll(`.webconsole-output .message${extraSelector}`);
  return [...messages].filter(msg => msg.innerText.includes(text));
}

function getAllMessages(opts) {
  const { ignoreErrors } = opts || {};
  const messageNodes = document.querySelectorAll(`.webconsole-output .message`);
  const messages = [];
  for (const node of messageNodes) {
    let type = "unknown";
    if (node.classList.contains("logPoint")) {
      type = "logPoint";
    } else if (node.classList.contains("console-api")) {
      type = "console-api";
    } else if (node.classList.contains("command")) {
      type = "command";
    } else if (node.classList.contains("result")) {
      type = "result";
    } else if (node.classList.contains("error")) {
      type = ignoreErrors ? undefined : "error";
    }
    if (type) {
      messages.push({
        type,
        content: [
          ...node.querySelectorAll(".objectBox, .objectBox-stackTrace, syntax-highlighted"),
        ].map(n => n.innerText),
      });
    }
  }
  return messages;
}

function checkAllMessages(expected, opts) {
  return waitUntil(
    () => {
      return isEqual(getAllMessages(opts), expected);
    },
    { waitingFor: `messages with ${JSON.stringify(opts)} to match ${JSON.stringify(expected)}` }
  );
}

function waitForMessage(text, extraSelector) {
  return waitUntil(
    () => {
      const messages = findMessages(text, extraSelector);
      return messages?.[0];
    },
    { waitingFor: `a message: ${text} with selector: ${extraSelector}` }
  );
}

async function warpToMessage(text) {
  const msg = await waitForMessage(text);
  const warpButton = msg.querySelector(".rewind") || msg.querySelector(".fast-forward");
  warpButton.click();
  await waitForPaused();
  assert(msg.classList.contains("paused"));
}

function checkPausedMessage(text) {
  return waitForMessage(text, ".paused");
}

function waitForMessageCount(text, count) {
  return waitUntil(
    () => {
      const messages = findMessages(text);
      return messages.length == count ? messages : null;
    },
    { waitingFor: `${count} messages with text: "${text}"` }
  );
}

async function checkMessageStack(text, expectedFrameLines, expand) {
  const msgNode = await waitForMessage(text);
  assert(!msgNode.classList.contains("open"));

  if (expand) {
    const button = await waitUntil(() => msgNode.querySelector(".collapse-button"), {
      waitingFor: `collapse button to be visible`,
    });
    button.click();
  }

  const framesNode = await waitUntil(() => msgNode.querySelector(".frames"), {
    waitingFor: ".frames to be present",
  });
  const frameNodes = Array.from(framesNode.querySelectorAll(".frame"));
  assert(frameNodes.length == expectedFrameLines.length);

  for (let i = 0; i < frameNodes.length; i++) {
    const frameNode = frameNodes[i];
    const line = frameNode.querySelector(".line").textContent;
    assert(line == expectedFrameLines[i].toString());
  }
}

function checkJumpIcon(msg) {
  const jumpIcon = msg.querySelector(".jump-definition");
  assert(jumpIcon);
}

function findObjectInspectorNode(oi, nodeLabel) {
  return [...oi.querySelectorAll(".tree-node")].find(node => {
    return node.innerText.includes(nodeLabel);
  });
}

async function findMessageExpandableObjectInspector(msg) {
  return waitUntil(
    () => {
      const inspectors = msg.querySelectorAll(".object-inspector");
      return [...inspectors].find(oi => oi.querySelector(".arrow"));
    },
    { waitingFor: `findMessageExpandableObjectInspector(${msg})` }
  );
}

async function toggleObjectInspectorNode(node) {
  const arrow = await waitUntil(() => node.querySelector(".arrow"), {
    waitingFor: ".arrow to be present",
  });
  arrow.click();
}

async function checkMessageObjectContents(msg, expected, expandList = []) {
  const oi = await findMessageExpandableObjectInspector(msg);
  await toggleObjectInspectorNode(oi);

  for (const label of expandList) {
    const labelNode = await waitUntil(() => findObjectInspectorNode(oi, label), {
      waitingFor: `findObjectInspectorNode(${oi}, ${label})`,
    });
    await toggleObjectInspectorNode(labelNode);
  }

  await waitUntil(
    () => {
      const nodes = oi.querySelectorAll(".tree-node");
      if (nodes && nodes.length > 1) {
        const properties = [...nodes].map(n => n.textContent);
        return expected.every(s => properties.find(v => v.includes(s)));
      }
      return null;
    },
    { waitingFor: ".tree-node to be present" }
  );
}

function findScopeNode(text) {
  return waitUntil(
    () => {
      const nodes = document.querySelectorAll(".scopes-list .node");
      return [...nodes].find(node => node.innerText.includes(text));
    },
    { waitingFor: `scope node "${text}" to be present` }
  );
}

async function toggleScopeNode(text) {
  const node = await findScopeNode(text);
  return toggleObjectInspectorNode(node);
}

async function executeInConsole(value) {
  window.jsterm.setValue(value);
  await waitUntil(() => window.jsterm.editor.getValue() === value);
  window.jsterm.execute();
  await new Promise(resolve => setTimeout(resolve, 1));
}

function waitForFrameTimeline(width) {
  return waitUntil(
    () => {
      const elem = document.querySelector(".frame-timeline-progress");
      return elem?.style.width == width;
    },
    { waitingFor: `timeline to be ${width} wide` }
  );
}
async function checkFrames(count) {
  return waitUntil(
    () => {
      const frames = dbgSelectors.getFrames();
      return frames.length == count;
    },
    { waitingFor: `${count} frames to be present` }
  );
}

async function selectFrame(index) {
  const frames = dbgSelectors.getFrames();
  await dbg.actions.selectFrame(getThreadContext(), frames[index]);
}

function addEventListenerLogpoints(logpoints) {
  return app.actions.addEventListenerBreakpoints(logpoints);
}

async function toggleExceptionLogging() {
  const shouldLogExceptions = app.selectors.getShouldLogExceptions();
  app.actions.logExceptions(!shouldLogExceptions);
}

async function toggleMappedSources() {
  return clickElement(".mapped-source button");
}

async function playbackRecording() {
  const timeline = await waitUntil(() => gToolbox.timeline, {
    waitingFor: "timeline to be visible",
  });
  timeline.startPlayback();
  await waitUntil(() => !timeline.state.playback, { waitingFor: "playback to start" });
}

async function findMarkupNode(text) {
  return waitUntil(
    () => {
      const nodes = document.querySelectorAll("#markup-box .editor");
      return [...nodes].find(n => n.innerText.includes(text));
    },
    { waitingFor: `markup node with ${text} to be present` }
  );
}

async function toggleMarkupNode(node) {
  const parent = node.closest(".expandable");
  const expander = parent.querySelector(".expander");
  expander.click();
}

async function searchMarkup(text) {
  const box = document.getElementById("inspector-searchbox");
  box.dispatchEvent(new FocusEvent("focus"));
  if (text !== undefined) {
    // Undefined is used to continue the previous search.
    box.value = text;
  }
  box.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
}

async function waitForSelectedMarkupNode(text) {
  return waitUntil(
    () => {
      const node = document.querySelector(".theme-selected");
      if (!node) {
        return false;
      }
      const editor = node.parentNode.querySelector(".editor");
      return editor.innerText.includes(text);
    },
    { waitingFor: `waitForSelectedMarkupNode(${text}) ` }
  );
}

function boundsCenter(bounds) {
  return {
    x: (bounds.left + bounds.right) / 2,
    y: (bounds.top + bounds.bottom) / 2,
  };
}

async function getMarkupCanvasCoordinate(text, iframes = []) {
  let x = 0,
    y = 0;
  for (const iframeText of iframes) {
    const node = (await ThreadFront.searchDOM(iframeText))[0];
    const { left, top } = await node.getBoundingClientRect();
    x += left;
    y += top;
  }
  const node = (await ThreadFront.searchDOM(text))[0];
  const center = boundsCenter(await node.getBoundingClientRect());
  x += center.x;
  y += center.y;
  return { x, y };
}

async function pickNode(x, y) {
  gToolbox.nodePicker.clickNodePickerButton();
  gToolbox.nodePicker.nodePickerMouseClickInCanvas({ x, y });
}

async function selectMarkupNode(node) {
  node.click();
  // the rules view updates asynchronously, so we wait one tick
  await new Promise(resolve => setTimeout(resolve, 0));
}

async function checkComputedStyle(style, value, matchedSelectors = undefined) {
  await clickElement("#computedview-tab");
  const matchedSelectorsJSON = matchedSelectors ? JSON.stringify(matchedSelectors) : undefined;
  await waitUntil(
    () => {
      const names = document.querySelectorAll(".computed-property-name");
      const propertyName = [...names].find(n => n.textContent.includes(style));
      if (!propertyName) {
        return false;
      }
      const container = propertyName.closest(".computed-property-view");
      if (!container) {
        return false;
      }
      const propertyValue = container.querySelector(".computed-property-value");
      const selectors = matchedSelectors ? JSON.stringify(getMatchedSelectors(style)) : undefined;
      return propertyValue.textContent.includes(value) && selectors === matchedSelectorsJSON;
    },
    { waitingFor: `computedStyle, ${style} to match ${value}` }
  );
}

function getMatchedSelectors(property) {
  const propertyNodes = document.querySelectorAll(".computed-property-view");

  const propertyNode = [...propertyNodes].find(
    node => node.querySelector(".computed-property-name").childNodes[0].textContent === property
  );

  if (!propertyNode) {
    return [];
  }

  const expander = propertyNode.querySelector(".computed-expander");
  if (!expander.matches(".open")) {
    expander.click();
  }

  assert(propertyNode.nextSibling.matches(".computed-property-content"));

  const selectorNodes = propertyNode.nextSibling.querySelectorAll(".rule-text");
  return [...selectorNodes].map(selectorNode => {
    const selector = selectorNode.children[0].innerText;
    const value = selectorNode.children[1].innerText;
    const label = selectorNode.previousSibling.innerText;
    const url = selectorNode.previousSibling.children[0].title;
    const overridden = selectorNode.parentNode.classList.contains("computed-overridden");
    return { selector, value, label, url, overridden };
  });
}

function setLonghandsExpanded(expanded) {
  document.querySelectorAll(".ruleview-expander").forEach(expander => {
    if (expander.style.display !== "none" && expander.classList.contains("open") !== expanded) {
      expander.click();
    }
  });
}

function getAppliedRulesJSON() {
  const rules = document.querySelectorAll(".ruleview-rule");
  return [...rules].map(rule => {
    const selector = rule.querySelector(".ruleview-selectorcontainer").innerText.trim();
    const source = rule.querySelector(".ruleview-rule-source").innerText.trim();
    const properties = [...rule.querySelectorAll(".ruleview-propertycontainer")].map(prop => {
      let longhandProps;
      if (prop.nextSibling) {
        longhandProps = [...prop.nextSibling.querySelectorAll("li")].map(longhand => ({
          text: longhand.innerText,
          overridden: longhand.classList.contains("ruleview-overridden"),
        }));
      }
      return {
        text: prop.innerText.trim(),
        overridden: prop.parentNode.className.includes("overridden"),
        longhandProps,
      };
    });
    return { selector, source, properties };
  });
}

async function checkAppliedRules(expected) {
  await ensurePseudoElementRulesExpanded();
  await waitUntil(
    () => {
      const json = getAppliedRulesJSON();
      return JSON.stringify(json) == JSON.stringify(expected);
    },
    {
      waitingFor: `applied rules to be: ${JSON.stringify(expected)}, found: ${JSON.stringify(
        getAppliedRulesJSON()
      )}`,
    }
  );
}

async function ensurePseudoElementRulesExpanded() {
  const header = document.getElementById("rules-section-pseudoelement-header");
  if (header && header.getAttribute("aria-expanded") != "true") {
    header.click();
    await waitUntil(() => header.getAttribute("aria-expanded") == "true", {
      waitingFor: "pseudo element rules to expand",
    });
  }
}

function dispatchMouseEvent(element, eventName) {
  element.dispatchEvent(
    new MouseEvent(eventName, { view: window, bubbles: true, cancelable: true })
  );
}

async function checkHighlighterVisible(visible) {
  await waitUntil(
    () => {
      const highlighterNode = document.getElementById("box-model-elements");
      const isVisible = highlighterNode?.attributes["hidden"]?.textContent !== "true";
      return isVisible === visible;
    },
    { waitingFor: `highlighter to be ${visible ? "" : "in"}visible` }
  );
}

async function checkHighlighterShape(svgPath) {
  const expectedCoords = svgPath.substring(1).split(/ L|,/);
  const highlighterPath = await waitUntil(
    () => {
      const highlighterNode = document.getElementById("box-model-content");
      return highlighterNode?.attributes["d"].textContent;
    },
    { waitingFor: "highlighter to appear" }
  );
  const highlighterCoords = highlighterPath.substring(1).split(/ L|,/);
  for (let i = 0; i < 8; i++) {
    if (Math.abs(highlighterCoords[i] - expectedCoords[i]) >= 1) {
      console.log(`expected ${expectedCoords}, received ${highlighterCoords}`);
      return false;
    }
  }
}

async function getMouseTarget(x, y) {
  return await ThreadFront.getMouseTarget(x, y);
}

async function getRecordingTarget() {
  return ThreadFront.recordingTargetWaiter.promise;
}

const testCommands = {
  selectConsole,
  selectDebugger,
  selectInspector,
  selectReactDevTools,
  assert,
  waitForTime,
  waitForElapsedTime,
  waitUntil,
  selectSource,
  addLogpoint,
  addBreakpoint,
  setBreakpointOptions,
  disableBreakpoint,
  removeAllBreakpoints,
  loadRegion,
  unloadRegion,
  waitForPaused,
  waitForPausedLine,
  rewindToLine,
  resumeToLine,
  reverseStepOverToLine,
  stepOverToLine,
  stepInToLine,
  stepOutToLine,
  reverseStepOverAndPause,
  stepOverAndPause,
  stepInAndPause,
  stepOutAndPause,
  hasFrames,
  waitForLoadedScopes,
  checkEvaluateInTopFrame,
  waitForScopeValue,
  toggleBlackboxSelectedSource,
  findMessages,
  getAllMessages,
  checkAllMessages,
  waitForMessage,
  warpToMessage,
  checkPausedMessage,
  waitForMessageCount,
  checkMessageStack,
  checkJumpIcon,
  checkMessageObjectContents,
  toggleObjectInspectorNode,
  findScopeNode,
  toggleScopeNode,
  executeInConsole,
  waitForFrameTimeline,
  checkFrames,
  selectFrame,
  addEventListenerLogpoints,
  toggleExceptionLogging,
  toggleMappedSources,
  playbackRecording,
  findMarkupNode,
  toggleMarkupNode,
  searchMarkup,
  waitForSelectedMarkupNode,
  getMarkupCanvasCoordinate,
  pickNode,
  selectMarkupNode,
  checkComputedStyle,
  getMatchedSelectors,
  setLonghandsExpanded,
  getAppliedRulesJSON,
  checkAppliedRules,
  dispatchMouseEvent,
  checkHighlighterVisible,
  checkHighlighterShape,
  getMouseTarget,
  getRecordingTarget,
  waitForSource,
  waitForSourceCount,
};

const commands = mapValues(testCommands, (command, name) => {
  return (...args) => {
    console.log(`Starting ${name}`, ...args);
    const startTime = new Date();
    let result = command(...args);
    if (result !== null && typeof result === "object" && typeof result.then === "function") {
      return result.then(async result => {
        const duration = new Date() - startTime;
        console.log(`Finished ${name} in ${duration}ms`);
        return result;
      });
    }
    const duration = new Date() - startTime;
    console.log(`Finished ${name} in ${duration}ms`);
    return result;
  };
});

async function describe(description, cbk) {
  console.log(`# Test ${description}`);
  try {
    await start();
    await cbk();
    finish();
  } catch (e) {
    console.log("TestFinished", { success: false, why: e.message });
  }
}

async function it(description, cbk) {
  console.log(`## ${description}`);
  await cbk();
}

module.exports = { ...commands, dbg, dbgSelectors, app, start, finish, describe, it };
