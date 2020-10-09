// Harness for use by automated tests. Adapted from various test devtools
// test harnesses.

const { ThreadFront } = require("protocol/thread");
const { setRandomLogpoint } = require("protocol/logpoint");
const { assert, waitForTime } = require("protocol/utils");

const dbg = gToolbox.getPanel("debugger").getVarsForTests();

const dbgSelectors = {};
for (const [name, method] of Object.entries(dbg.selectors)) {
  dbgSelectors[name] = (...args) => method(dbg.store.getState(), ...args);
}

function waitForElapsedTime(time, ms) {
  const wait = time + ms - Date.now();
  if (wait > 0) {
    return waitForTime(wait);
  }
}

async function waitUntil(fn) {
  for (let i = 0; i < 200; i++) {
    const rv = fn();
    if (rv) {
      return rv;
    }
    await waitForTime(i < 10 ? 50 : 100);
  }
  throw new Error("waitUntil() timed out");
}

function finish() {
  console.log("TestFinished");

  // This is pretty goofy but this is recognized during automated tests and sent
  // to the UI process to indicate the test has finished.
  dump(`RecReplaySendAsyncMessage TestFinished`);
}

function selectConsole() {
  return gToolbox.selectTool("console");
}

function selectDebugger() {
  return gToolbox.selectTool("debugger");
}

function selectInspector() {
  return gToolbox.selectTool("inspector");
}

function getContext() {
  return dbgSelectors.getContext();
}

function getThreadContext() {
  return dbgSelectors.getThreadContext();
}

function findSource(url) {
  if (typeof url !== "string") {
    // Support passing in a source object itelf all APIs that use this
    // function support both styles
    const source = url;
    return source;
  }

  const sources = dbgSelectors.getSourceList();
  return sources.find(s => (s.url || "").includes(url));
}

function waitForSource(url) {
  return waitUntil(() => findSource(url));
}

async function selectSource(url) {
  const source = await waitForSource(url);
  await dbg.actions.selectLocation(getContext(), { sourceId: source.id }, { keepContext: false });
  return waitForSelectedSource(url);
}

async function addBreakpoint(url, line, column, options = { logValue: "displayName" }) {
  const source = await waitForSource(url);
  const sourceId = source.id;
  const bpCount = dbgSelectors.getBreakpointCount();
  await dbg.actions.addBreakpoint(getContext(), { sourceId, line, column }, options);
  await waitUntil(() => {
    return dbgSelectors.getBreakpointCount() == bpCount + 1;
  });
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

function isPaused() {
  return dbgSelectors.getIsPaused();
}

async function waitForLoadedScopes() {
  const scopes = await waitUntil(() => document.querySelector(".scopes-list"));
  // Since scopes auto-expand, we can assume they are loaded when there is a tree node
  // with the aria-level attribute equal to "2".
  await waitUntil(() => scopes.querySelector('.tree-node[aria-level="2"]'));
}

async function waitForInlinePreviews() {
  await waitUntil(() => dbgSelectors.getSelectedInlinePreviews());
}

function waitForSelectedSource(url) {
  const { getSelectedSourceWithContent, hasSymbols, getBreakableLines } = dbgSelectors;

  return waitUntil(() => {
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
    return /*hasSymbols(source) &&*/ getBreakableLines(source.id);
  });
}

async function waitForPaused(url) {
  const { getSelectedScope, getCurrentFrames } = dbgSelectors;

  await waitUntil(() => {
    return isPaused() && !!getSelectedScope();
  });

  await waitUntil(() => getCurrentFrames());
  await waitForLoadedScopes();
  await waitForSelectedSource(url);
}

async function waitForPausedNoSource() {
  await waitUntil(() => isPaused());
}

function hasFrames() {
  const frames = dbgSelectors.getCurrentFrames();
  return frames.length > 0;
}

function getVisibleSelectedFrameLine() {
  const frame = dbgSelectors.getVisibleSelectedFrame();
  return frame && frame.location.line;
}

function waitForPausedLine(line) {
  return waitUntil(() => line == getVisibleSelectedFrameLine());
}

function resumeThenPauseAtLineFunctionFactory(method) {
  return async function (lineno, waitForLine) {
    console.log(`Starting ${method} to ${lineno}...`, new Date());
    await dbg.actions[method](getThreadContext());
    if (lineno !== undefined) {
      await waitForPaused();
    } else {
      await waitForPausedNoSource();
    }
    if (waitForLine) {
      await waitForPausedLine(lineno);
    } else {
      const pauseLine = getVisibleSelectedFrameLine();
      assert(pauseLine == lineno, `Expected line ${lineno} got ${pauseLine}`);
    }
    console.log(`Finished ${method} to ${lineno}!`, new Date());
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

async function ensureWatchpointsExpanded() {
  const header = document.querySelector(".watch-expressions-pane ._header");
  if (!header.querySelector(".expanded")) {
    header.click();
    await waitUntil(() => header.querySelector(".expanded"));
  }
}

async function checkEvaluateInTopFrame(text, expected) {
  await ensureWatchpointsExpanded();
  await dbg.actions.addExpression(getThreadContext(), text);
  await waitUntil(() => {
    const node = document.querySelector(".watch-expressions-pane .object-node");
    return node && node.innerText == `${text}: ${expected}`;
  });
  await dbg.actions.deleteExpression({ input: text });
}

async function waitForScopeValue(name, value) {
  const expected = value !== undefined ? `${name}\n: \n${value}` : name;
  return waitUntil(() => {
    const nodes = document.querySelectorAll(".scopes-pane .object-node");
    return [...nodes].some(node => node.innerText == expected);
  });
}

async function toggleBlackboxSelectedSource() {
  const { getSelectedSource } = dbgSelectors;
  const blackboxed = getSelectedSource().isBlackBoxed;
  document.querySelector(".black-box").click();
  await waitUntil(() => getSelectedSource().isBlackBoxed != blackboxed);
  await ThreadFront.waitForInvalidateCommandsToFinish();
}

function findMessages(text, extraSelector = "") {
  const messages = document.querySelectorAll(`.webconsole-output .message${extraSelector}`);
  return [...messages].filter(msg => msg.innerText.includes(text));
}

function waitForMessage(text, extraSelector) {
  return waitUntil(() => {
    const messages = findMessages(text, extraSelector);
    return messages.length ? messages[0] : null;
  });
}

async function warpToMessage(text) {
  const msg = await waitForMessage(text);
  const warpButton = msg.querySelector(".rewindable");
  warpButton.click();
  await waitForPaused();
}

function checkPausedMessage(text) {
  return waitForMessage(text, ".paused");
}

function waitForMessageCount(text, count) {
  return waitUntil(() => {
    const messages = findMessages(text);
    return messages.length == count ? messages : null;
  });
}

async function checkMessageStack(text, expectedFrameLines, expand) {
  const msgNode = await waitForMessage(text);
  assert(!msgNode.classList.contains("open"));

  if (expand) {
    const button = await waitUntil(() => msgNode.querySelector(".collapse-button"));
    button.click();
  }

  const framesNode = await waitUntil(() => msgNode.querySelector(".frames"));
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
  return waitUntil(() => {
    const inspectors = msg.querySelectorAll(".object-inspector");
    return [...inspectors].find(oi => oi.querySelector(".arrow"));
  });
}

async function toggleObjectInspectorNode(node) {
  const arrow = await waitUntil(() => node.querySelector(".arrow"));
  arrow.click();
}

async function checkMessageObjectContents(msg, expected, expandList = []) {
  const oi = await findMessageExpandableObjectInspector(msg);

  await toggleObjectInspectorNode(oi);

  for (const label of expandList) {
    const labelNode = await waitUntil(() => findObjectInspectorNode(oi, label));
    await toggleObjectInspectorNode(labelNode);
  }

  await waitUntil(() => {
    const nodes = oi.querySelectorAll(".tree-node");
    if (nodes && nodes.length > 1) {
      const properties = [...nodes].map(n => n.textContent);
      return expected.every(s => properties.find(v => v.includes(s)));
    }
    return null;
  });
}

function findScopeNode(text) {
  return waitUntil(() => {
    const nodes = document.querySelectorAll(".scopes-list .node");
    return [...nodes].find(node => node.innerText.includes(text));
  });
}

async function toggleScopeNode(text) {
  const node = await findScopeNode(text);
  return toggleObjectInspectorNode(node);
}

async function executeInConsole(text) {
  gToolbox.getPanel("console").hud.evaluateInput(text);
}

async function checkInlinePreview(name, text) {
  await waitUntil(() => {
    const previews = document.querySelectorAll(".inline-preview-outer");
    return [...previews].some(p => {
      const label = p.querySelector(".inline-preview-label");
      const value = p.querySelector(".inline-preview-value");
      return label.innerText.includes(name) && value.innerText.includes(text);
    });
  });
}

function waitForFrameTimeline(width) {
  return waitUntil(() => {
    const elem = document.querySelector(".frame-timeline-progress");
    return elem && elem.style.width == width;
  });
}

async function checkFrames(count) {
  return waitUntil(() => {
    const frames = dbgSelectors.getFrames();
    return frames.length == count;
  });
}

async function selectFrame(index) {
  const frames = dbgSelectors.getFrames();
  await dbg.actions.selectFrame(getThreadContext(), frames[index]);
}

function addEventListenerLogpoints(logpoints) {
  return app.actions.addEventListenerBreakpoints(logpoints);
}

async function toggleExceptionLogging() {
  const elem = await waitUntil(() => document.querySelector(".breakpoints-exceptions input"));
  elem.click();
}

async function toggleMappedSources() {
  const elem = await waitUntil(() => document.querySelector(".mapped-source"));
  elem.click();
}

async function playbackRecording() {
  const timeline = await waitUntil(() => gToolbox.timeline);
  timeline.startPlayback();
  await waitUntil(() => !timeline.state.playback);
}

async function randomLog(numLogs) {
  const messages = await setRandomLogpoint(numLogs);
  await Promise.all(messages.map(text => waitForMessage(text)));
  return messages;
}

async function findMarkupNode(text) {
  return waitUntil(() => {
    const nodes = document.querySelectorAll("#markup-box .editor");
    return [...nodes].find(n => n.innerText.includes(text));
  });
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
  return waitUntil(() => {
    const node = document.querySelector(".theme-selected");
    if (!node) {
      return false;
    }
    const editor = node.parentNode.querySelector(".editor");
    return editor.innerText.includes(text);
  });
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
    await node.ensureLoaded();
    const { left, top } = node.getBoundingClientRect();
    x += left;
    y += top;
  }
  const node = (await ThreadFront.searchDOM(text))[0];
  await node.ensureLoaded();
  const center = boundsCenter(node.getBoundingClientRect());
  x += center.x;
  y += center.y;
  return { x, y };
}

async function pickNode(x, y) {
  gToolbox.nodePicker.clickNodePickerButton();
  gToolbox.nodePicker.nodePickerMouseClickInCanvas({ x, y });
}

async function selectMarkupNode(node) {
  const container = node.closest(".child");
  const { x, y } = boundsCenter(container.getBoundingClientRect());
  const event = new MouseEvent("mousedown", { clientX: x, clientY: y });
  container.dispatchEvent(event);
}

async function checkComputedStyle(style, value) {
  document.getElementById("computedview-tab").click();
  await waitUntil(() => {
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
    return propertyValue.textContent.includes(value);
  });
}

function getAppliedRulesJSON() {
  const rules = document.querySelectorAll(".ruleview-rule");
  return [...rules].map(rule => {
    const selector = rule.querySelector(".ruleview-selectorcontainer").innerText.trim();
    const source = rule.querySelector(".ruleview-rule-source").innerText.trim();
    const properties = [...rule.querySelectorAll(".ruleview-property")].map(prop => {
      return {
        text: prop.innerText.trim(),
        overridden: prop.className.includes("overridden"),
      };
    });
    return { selector, source, properties };
  });
}

async function checkAppliedRules(expected) {
  await ensurePseudoElementRulesExpanded();
  await waitUntil(() => {
    const json = getAppliedRulesJSON();
    return JSON.stringify(json) == JSON.stringify(expected);
  });
}

async function ensurePseudoElementRulesExpanded() {
  const header = document.getElementById("rules-section-pseudoelement-header");
  if (header && header.getAttribute("aria-expanded") != "true") {
    header.click();
    await waitUntil(() => header.getAttribute("aria-expanded") == "true");
  }
}

const testCommands = {
  selectConsole,
  selectDebugger,
  selectInspector,
  dbg,
  assert,
  finish,
  waitForTime,
  waitForElapsedTime,
  waitUntil,
  selectSource,
  addBreakpoint,
  setBreakpointOptions,
  disableBreakpoint,
  removeAllBreakpoints,
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
  waitForInlinePreviews,
  checkEvaluateInTopFrame,
  waitForScopeValue,
  toggleBlackboxSelectedSource,
  findMessages,
  waitForMessage,
  warpToMessage,
  checkPausedMessage,
  waitForMessageCount,
  checkMessageStack,
  checkJumpIcon,
  checkMessageObjectContents,
  toggleObjectInspectorNode,
  findMessageExpandableObjectInspector,
  findScopeNode,
  toggleScopeNode,
  executeInConsole,
  checkInlinePreview,
  waitForFrameTimeline,
  checkFrames,
  selectFrame,
  addEventListenerLogpoints,
  toggleExceptionLogging,
  toggleMappedSources,
  playbackRecording,
  randomLog,
  findMarkupNode,
  toggleMarkupNode,
  searchMarkup,
  waitForSelectedMarkupNode,
  getMarkupCanvasCoordinate,
  pickNode,
  selectMarkupNode,
  checkComputedStyle,
  getAppliedRulesJSON,
  checkAppliedRules,
};

module.exports = Object.entries(testCommands).reduce((exports, [name, func]) => {
  exports[name] = (...args) => {
    console.log(name, ...args);
    return func(...args);
  };
  return exports;
}, {});
