/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import type { UIStore, UIThunkAction } from "ui/actions";

import { getAllFilters } from "../selectors/messages";

import {
  prepareMessage,
  isBrowserInternalMessage,
} from "devtools/client/webconsole/utils/messages";
import { IdGenerator } from "devtools/client/webconsole/utils/id-generator";
import { Pause, ThreadFront } from "protocol/thread";
import { LogpointHandlers } from "protocol/logpoint";
import { TestMessageHandlers } from "protocol/find-tests";
import { onConsoleOverflow } from "ui/actions/session";

import type { Message, Frame, ExecutionPoint } from "@recordreplay/protocol";
import type { Message as InternalMessage } from "../reducers/messages";
import {
  messageEvaluationsCleared,
  logpointMessagesCleared,
  messagesAdded,
  messageOpened,
  messageClosed,
  messagesLoaded,
} from "../reducers/messages";

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
  ).then(() => store.dispatch(messagesLoaded()));
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

export function messagesAdd(
  packets: unknown[],
  idGenerator: IdGenerator | null = null
): UIThunkAction {
  return (dispatch, getState) => {
    if (idGenerator == null) {
      idGenerator = defaultIdGenerator;
    }
    // TODO This really a good type here?
    const messages: InternalMessage[] = packets.map(packet => prepareMessage(packet, idGenerator));
    dispatch(messagesAdded(messages));
  };
}

export const messagesClearEvaluations = messageEvaluationsCleared;
export const messagesClearLogpoint = logpointMessagesCleared;
export const messageOpen = messageOpened;
export const messageClose = messageClosed;
