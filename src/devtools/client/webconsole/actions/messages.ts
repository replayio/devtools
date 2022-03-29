/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import type { UIState } from "ui/state";
import type { UIStore, UIThunkAction } from "ui/actions";

import { getAllFilters } from "../reducers/filters";

const {
  prepareMessage,
  isBrowserInternalMessage,
} = require("devtools/client/webconsole/utils/messages");
const { IdGenerator } = require("devtools/client/webconsole/utils/id-generator");
import { Pause, ThreadFront } from "protocol/thread";
import { LogpointHandlers } from "protocol/logpoint";
import { TestMessageHandlers } from "protocol/find-tests";
import { onConsoleOverflow } from "ui/actions/session";

const {
  MESSAGES_ADD,
  MESSAGES_CLEAR_LOGPOINT,
  MESSAGE_OPEN,
  MESSAGE_CLOSE,
  MESSAGE_UPDATE_PAYLOAD,
  MESSAGES_CLEAR_EVALUATIONS,
  MESSAGES_CLEAR_EVALUATION,
} = require("devtools/client/webconsole/constants");

import type { Message, Frame, ExecutionPoint } from "@recordreplay/protocol";
import type { Message as InternalMessage } from "../reducers/messages";

const defaultIdGenerator = new IdGenerator();
let queuedMessages: unknown[] = [];
let throttledDispatchPromise: Promise<void> | null = null;

export function setupMessages(store: UIStore) {
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

function convertStack(stack: string[], { frames }: { frames?: Frame[] }) {
  if (!stack) {
    return null;
  }
  return Promise.all(
    stack.map(async frameId => {
      const frame = frames!.find(f => f.frameId == frameId)!;
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

function onConsoleMessage(msg: Message): UIThunkAction {
  return async dispatch => {
    const stacktrace = await convertStack(msg.stack!, msg.data);
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
        const ids = ThreadFront.getSourceIdsForURL(url!);
        if (ids.length == 1) {
          msgSourceId = ids[0];
        }
      }
      if (msgSourceId) {
        // Ask the ThreadFront to map the location we got manually.
        const location = await ThreadFront.getPreferredMappedLocation({
          sourceId: msgSourceId,
          line: line!,
          column: column!,
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
      stacktrace: stacktrace!,
      argumentValues: msg.argumentValues,
      executionPoint: msg.point.point,
      executionPointTime: msg.point.time,
      executionPointHasFrames: !!stacktrace,
      pauseId: msg.pauseId,
    };

    dispatch(dispatchMessageAdd(packet));
  };
}

function onLogpointLoading(
  logGroupId: string,
  point: ExecutionPoint,
  time: number,
  { sourceId, line, column }: { sourceId: string; line: number; column: number }
): UIThunkAction {
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

function onLogpointResult(
  logGroupId: string,
  point: string,
  time: number,
  { sourceId, line, column }: { sourceId: string; line: number; column: number },
  pause?: Pause,
  values?: unknown[]
): UIThunkAction {
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

function dispatchMessageAdd(packet: unknown): UIThunkAction {
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

export function messagesAdd(packets: unknown[], idGenerator = null): UIThunkAction {
  return (dispatch, getState) => {
    if (idGenerator == null) {
      idGenerator = defaultIdGenerator;
    }
    // TODO This really a good type here?
    const messages: InternalMessage[] = packets.map(packet => prepareMessage(packet, idGenerator));
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

export function messagesClearEvaluation(messageId: string, messageType: string) {
  // The messageType is only used for logging purposes to determine what type of messages
  // are typically cleared.
  return {
    type: MESSAGES_CLEAR_EVALUATION,
    messageId,
    messageType,
  };
}

export function messagesClearLogpoint(logpointId: string) {
  return {
    type: MESSAGES_CLEAR_LOGPOINT,
    logpointId,
  };
}

export function messageOpen(id: string): UIThunkAction {
  return (dispatch, getState) => {
    const filtersState = getAllFilters(getState());
    return dispatch({
      type: MESSAGE_OPEN,
      id,
      filtersState,
    });
  };
}

export function messageClose(id: string) {
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
export function messageUpdatePayload(id: string, data: any) {
  return {
    type: MESSAGE_UPDATE_PAYLOAD,
    id,
    data,
  };
}
