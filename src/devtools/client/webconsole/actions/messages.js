/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import { getAllFilters } from "../selectors/filters";

const {
  prepareMessage,
  isBrowserInternalMessage,
} = require("devtools/client/webconsole/utils/messages");
const { IdGenerator } = require("devtools/client/webconsole/utils/id-generator");
const { ThreadFront } = require("protocol/thread");
const { LogpointHandlers } = require("protocol/logpoint");
const { TestMessageHandlers } = require("protocol/find-tests");
const { onConsoleOverflow } = require("ui/actions/session");

const {
  MESSAGES_ADD,
  MESSAGES_CLEAR_LOGPOINT,
  MESSAGE_OPEN,
  MESSAGE_CLOSE,
  MESSAGE_UPDATE_PAYLOAD,
  MESSAGES_CLEAR_EVALUATIONS,
  MESSAGES_CLEAR_EVALUATION,
} = require("devtools/client/webconsole/constants");
import { trackEvent } from "ui/utils/telemetry";

const defaultIdGenerator = new IdGenerator();
let queuedMessages = [];
let throttledDispatchPromise = null;

export function setupMessages(store) {
  LogpointHandlers.onPointLoading = (logGroupId, point, time, location) =>
    store.dispatch(onLogpointLoading(logGroupId, point, time, location));
  LogpointHandlers.onResult = (logGroupId, point, time, location, pause, values) =>
    store.dispatch(onLogpointResult(logGroupId, point, time, location, pause, values));
  LogpointHandlers.clearLogpoint = logGroupId => store.dispatch(messagesClearLogpoint(logGroupId));
  TestMessageHandlers.onTestMessage = msg => store.dispatch(onConsoleMessage(msg));

  ThreadFront.findConsoleMessages(
    (_, msg) => store.dispatch(onConsoleMessage(msg)),
    () => store.dispatch(onConsoleOverflow())
  ).then(() => store.dispatch({ type: "MESSAGES_LOADED" }));
}

function convertStack(stack, { frames }) {
  if (!stack) {
    return null;
  }
  return Promise.all(
    stack.map(async frameId => {
      const frame = frames.find(f => f.frameId == frameId);
      const location = await ThreadFront.getPreferredLocation(frame.location);
      return {
        filename: await ThreadFront.getSourceURL(location.sourceId),
        sourceId: location.sourceId,
        lineNumber: location.line,
        columnNumber: location.column,
        functionName: frame.functionName,
      };
    })
  );
}

function onConsoleMessage(msg) {
  return async dispatch => {
    const stacktrace = await convertStack(msg.stack, msg.data);
    const sourceId = stacktrace?.[0]?.sourceId;

    let { url, sourceId: msgSourceId, line, column } = msg;

    // Skip messages that are coming from a firefox internal JS file
    if (isBrowserInternalMessage(msg.text)) {
      return;
    }

    if (msg.point.frame) {
      // If the execution point has a location, use any mappings in that location.
      // The message properties do not reflect any source mapping.
      const location = await ThreadFront.getPreferredLocation(msg.point.frame);
      url = await ThreadFront.getSourceURL(location.sourceId);
      line = location.line;
      column = location.column;
    } else {
      if (!msgSourceId) {
        const ids = ThreadFront.getSourceIdsForURL(url);
        if (ids.length == 1) {
          msgSourceId = ids[0];
        }
      }
      if (msgSourceId) {
        // Ask the ThreadFront to map the location we got manually.
        const location = await ThreadFront.getPreferredMappedLocation({
          sourceId: msgSourceId,
          line,
          column,
        });
        url = await ThreadFront.getSourceURL(location.sourceId);
        line = location.line;
        column = location.column;
      }
    }

    const packet = {
      errorMessage: msg.text,
      errorMessageName: "ErrorMessageName",
      sourceName: url,
      sourceId,
      lineNumber: line,
      columnNumber: column,
      category: msg.source,
      warning: msg.level == "warning",
      error: msg.level == "error",
      info: msg.level == "info",
      trace: msg.level == "trace",
      assert: msg.level == "assert",
      stacktrace,
      argumentValues: msg.argumentValues,
      executionPoint: msg.point.point,
      executionPointTime: msg.point.time,
      executionPointHasFrames: !!stacktrace,
      pauseId: msg.pauseId,
    };

    dispatch(dispatchMessageAdd(packet));
  };
}

function onLogpointLoading(logGroupId, point, time, { sourceId, line, column }) {
  return async dispatch => {
    const packet = {
      errorMessage: "Loading...",
      sourceName: await ThreadFront.getSourceURL(sourceId),
      sourceId: sourceId,
      lineNumber: line,
      columnNumber: column,
      category: "ConsoleAPI",
      info: true,
      executionPoint: point,
      executionPointTime: time,
      executionPointHasFrames: true,
      logpointId: logGroupId,
    };

    dispatch(dispatchMessageAdd(packet));
  };
}

function onLogpointResult(logGroupId, point, time, { sourceId, line, column }, pause, values) {
  return async dispatch => {
    const packet = {
      errorMessage: "",
      sourceName: await ThreadFront.getSourceURL(sourceId),
      sourceId: sourceId,
      lineNumber: line,
      columnNumber: column,
      category: "ConsoleAPI",
      info: true,
      argumentValues: values,
      executionPoint: point,
      executionPointTime: time,
      executionPointHasFrames: true,
      logpointId: logGroupId,
      pauseId: pause?.pauseId,
    };

    dispatch(dispatchMessageAdd(packet));
  };
}

function dispatchMessageAdd(packet) {
  return dispatch => {
    queuedMessages = queuedMessages.concat(packet);
    if (throttledDispatchPromise) {
      return throttledDispatchPromise;
    }

    throttledDispatchPromise = new Promise(done => {
      setTimeout(async () => {
        throttledDispatchPromise = null;
        dispatch(messagesAdd(queuedMessages));

        queuedMessages = [];

        done();
      }, 50);
    });
    return throttledDispatchPromise;
  };
}

export function messagesAdd(packets, idGenerator = null) {
  return (dispatch, getState) => {
    if (idGenerator == null) {
      idGenerator = defaultIdGenerator;
    }
    const messages = packets.map(packet => prepareMessage(packet, idGenerator));
    const filtersState = getAllFilters(getState());

    return dispatch({
      type: MESSAGES_ADD,
      messages,
      filtersState,
    });
  };
}

export function messagesClearEvaluations() {
  return {
    type: MESSAGES_CLEAR_EVALUATIONS,
  };
}

export function messagesClearEvaluation(messageId, messageType) {
  // The messageType is only used for logging purposes to determine what type of messages
  // are typically cleared.
  return {
    type: MESSAGES_CLEAR_EVALUATION,
    messageId,
    messageType,
  };
}

export function messagesClearLogpoint(logpointId) {
  return {
    type: MESSAGES_CLEAR_LOGPOINT,
    logpointId,
  };
}

export function messageOpen(id) {
  return (dispatch, getState) => {
    const filtersState = getAllFilters(getState());
    return dispatch({
      type: MESSAGE_OPEN,
      id,
      filtersState,
    });
  };
}

export function messageClose(id) {
  return {
    type: MESSAGE_CLOSE,
    id,
  };
}

/**
 * Associate additional data with a message without mutating the original message object.
 *
 * @param {String} id
 *        Message ID
 * @param {Object} data
 *        Object with arbitrary data.
 */
export function messageUpdatePayload(id, data) {
  return {
    type: MESSAGE_UPDATE_PAYLOAD,
    id,
    data,
  };
}
