/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// Harness for use by automated tests. Adapted from various test devtools
// test harnesses.

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

function getContext(dbg) {
  return dbgSelectors.getContext();
}

function getThreadContext(dbg) {
  return dbgSelectors.getThreadContext();
}

function findSource(url, { silent } = { silent: false }) {
  if (typeof url !== "string") {
    // Support passing in a source object itelf all APIs that use this
    // function support both styles
    const source = url;
    return source;
  }

  return waitUntil(() => {
    const sources = dbgSelectors.getSourceList();
    return sources.find(s => (s.url || "").includes(url));
  });
}

async function addBreakpoint(url, line, column, options) {
  const source = await findSource(url);
  const sourceId = source.id;
  const bpCount = dbgSelectors.getBreakpointCount();
  await dbg.actions.addBreakpoint(
    getContext(dbg),
    { sourceId, line, column },
    options
  );
  await waitUntil(() => {
    return dbgSelectors.getBreakpointCount() == bpCount + 1;
  });
}

function isPaused() {
  return dbgSelectors.getIsPaused(dbgSelectors.getCurrentThread());
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
      ok(pauseLine == lineno, `Paused at line ${pauseLine} expected ${lineno}`);
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

module.exports = {
  dbg,
  addBreakpoint,
  rewindToLine,
  resumeToLine,
  reverseStepOverToLine,
  stepOverToLine,
  stepInToLine,
  stepOutToLine,
};
