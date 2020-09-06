/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

/**
 * This file is for use by unit tests for isolated debugger components that do
 * not need to interact with the redux store. When these tests need to construct
 * debugger objects, these interfaces should be used instead of plain object
 * literals.
 */

import * as asyncValue from "./async-value";

function makeMockSource(url = "url", id = "source") {
  return {
    id,
    url,
    isBlackBoxed: false,
    isPrettyPrinted: false,
    relativeUrl: url,
    introductionUrl: null,
    introductionType: undefined,
    extensionName: null,
    isExtension: false,
    isOriginal: id.includes("originalSource"),
  };
}

function makeMockSourceWithContent(url, id, contentType = "text/javascript", text = "") {
  const source = makeMockSource(url, id);

  return {
    ...source,
    content: text
      ? asyncValue.fulfilled({
          type: "text",
          value: text,
          contentType,
        })
      : null,
  };
}

function makeMockSourceAndContent(url, id, contentType = "text/javascript", text = "") {
  const source = makeMockSource(url, id);

  return {
    ...source,
    content: {
      type: "text",
      value: text,
      contentType,
    },
  };
}

function makeMockScope(actor = "scope-actor", type = "block", parent = null) {
  return {
    actor,
    parent,
    bindings: {
      arguments: [],
      variables: {},
    },
    object: null,
    function: null,
    type,
    scopeKind: "",
  };
}

function mockScopeAddVariable(scope, name) {
  if (!scope.bindings) {
    throw new Error("no scope bindings");
  }
  scope.bindings.variables[name] = { value: null };
}

function makeMockBreakpoint(source = makeMockSource(), line = 1, column) {
  const location = column ? { sourceId: source.id, line, column } : { sourceId: source.id, line };
  return {
    id: "breakpoint",
    location,
    astLocation: null,
    generatedLocation: location,
    disabled: false,
    text: "text",
    originalText: "text",
    options: {},
  };
}

function makeMockFrame(
  id = "frame",
  source = makeMockSource("url"),
  scope = makeMockScope(),
  line = 4,
  displayName = `display-${id}`,
  index = 0
) {
  const location = { sourceId: source.id, line };
  return {
    id,
    thread: "FakeThread",
    displayName,
    location,
    generatedLocation: location,
    source,
    scope,
    this: {},
    index,
    asyncCause: null,
    state: "on-stack",
  };
}

function makeMockFrameWithURL(url) {
  return makeMockFrame(undefined, makeMockSource(url));
}

function makeWhyNormal(frameReturnValue = undefined) {
  if (frameReturnValue) {
    return { type: "why-normal", frameFinished: { return: frameReturnValue } };
  }
  return { type: "why-normal" };
}

function makeWhyThrow(frameThrowValue) {
  return { type: "why-throw", frameFinished: { throw: frameThrowValue } };
}

function makeMockExpression(value) {
  return {
    input: "input",
    value,
    from: "from",
    updating: false,
  };
}

// Mock contexts for use in tests that do not create a redux store.
const mockcx = { navigateCounter: 0 };
const mockthreadcx = {
  navigateCounter: 0,
  thread: "FakeThread",
  pauseCounter: 0,
  isPaused: false,
};

export {
  makeMockSource,
  makeMockSourceWithContent,
  makeMockSourceAndContent,
  makeMockScope,
  mockScopeAddVariable,
  makeMockBreakpoint,
  makeMockFrame,
  makeMockFrameWithURL,
  makeWhyNormal,
  makeWhyThrow,
  makeMockExpression,
  mockcx,
  mockthreadcx,
};
