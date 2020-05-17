/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// Harness for use by automated tests. Adapted from various test devtools
// test harnesses.

const { ThreadFront } = require("protocol/thread");
const { assert } = require("protocol/utils");

const dbg = gToolbox._panels.jsdebugger.getVarsForTests();

const dbgSelectors = {};
for (const [name, method] of Object.entries(dbg.selectors)) {
  dbgSelectors[name] = (...args) => method(dbg.store.getState(), ...args);
}

function waitForTime(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function waitUntil(fn) {
  while (true) {
    const rv = fn();
    if (rv) {
      return rv;
    }
    await waitForTime(50);
  }
}

function finish() {
  console.log("TestFinished");

  // This is pretty goofy but this is recognized during automated tests and sent
  // to the UI process to indicate the test has finished.
  dump(`WebReplaySendAsyncMessage TestFinished`);
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

async function addBreakpoint(url, line, column, options) {
  const source = await waitForSource(url);
  const sourceId = source.id;
  const bpCount = dbgSelectors.getBreakpointCount();
  await dbg.actions.addBreakpoint(
    getContext(),
    { sourceId, line, column },
    options
  );
  await waitUntil(() => {
    return dbgSelectors.getBreakpointCount() == bpCount + 1;
  });
}

function removeAllBreakpoints() {
  return dbg.actions.removeAllBreakpoints(getContext());
}

function isPaused() {
  return dbgSelectors.getIsPaused(dbgSelectors.getCurrentThread());
}

async function waitForLoadedScopes(dbg) {
  const scopes = await waitUntil(() => document.querySelector(".scopes-list"));
  // Since scopes auto-expand, we can assume they are loaded when there is a tree node
  // with the aria-level attribute equal to "2".
  await waitUntil(() => scopes.querySelector('.tree-node[aria-level="2"]'));
}

function waitForSelectedSource(url) {
  const {
    getSelectedSourceWithContent,
    hasSymbols,
    getBreakableLines,
  } = dbgSelectors;

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

    return hasSymbols(source) && getBreakableLines(source.id);
  });
}

async function waitForPaused(url) {
  const {
    getSelectedScope,
    getCurrentThread,
    getCurrentThreadFrames,
  } = dbgSelectors;

  await waitUntil(() => {
    return isPaused() && !!getSelectedScope(getCurrentThread());
  });

  await waitUntil(() => getCurrentThreadFrames());
  await waitForLoadedScopes();
  await waitForSelectedSource(url);
}

async function waitForPausedNoSource() {
  await waitUntil(() => isPaused());
}

function getVisibleSelectedFrameLine() {
  const frame = dbgSelectors.getVisibleSelectedFrame();
  return frame && frame.location.line;
}

function resumeThenPauseAtLineFunctionFactory(method) {
  return async function(lineno, waitForLine) {
    await dbg.actions[method](getThreadContext());
    if (lineno !== undefined) {
      await waitForPaused();
    } else {
      await waitForPausedNoSource();
    }
    if (waitForLine) {
      await waitUntil(() => lineno == getVisibleSelectedFrameLine());
    } else {
      const pauseLine = getVisibleSelectedFrameLine();
      assert(pauseLine == lineno);
    }
  };
}

// Define various methods that resume a thread in a specific way and ensure it
// pauses at a specified line.
const rewindToLine = resumeThenPauseAtLineFunctionFactory("rewind");
const resumeToLine = resumeThenPauseAtLineFunctionFactory("resume");
const reverseStepOverToLine = resumeThenPauseAtLineFunctionFactory(
  "reverseStepOver"
);
const stepOverToLine = resumeThenPauseAtLineFunctionFactory("stepOver");
const stepInToLine = resumeThenPauseAtLineFunctionFactory("stepIn");
const stepOutToLine = resumeThenPauseAtLineFunctionFactory("stepOut");

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
  return waitUntil(() => {
    const nodes = document.querySelectorAll(".scopes-pane .object-node");
    return [...nodes].some(node => node.innerText == `${name}\n: \n${value}`);
  });
}

module.exports = {
  dbg,
  finish,
  addBreakpoint,
  removeAllBreakpoints,
  rewindToLine,
  resumeToLine,
  reverseStepOverToLine,
  stepOverToLine,
  stepInToLine,
  stepOutToLine,
  checkEvaluateInTopFrame,
  waitForScopeValue,
};
