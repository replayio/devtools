/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import type { ExecutionPoint, Frame } from "@replayio/protocol";
import * as Sentry from "@sentry/browser";
import { IdGenerator } from "devtools/client/webconsole/utils/id-generator";
import {
  prepareMessage,
  isBrowserInternalMessage,
} from "devtools/client/webconsole/utils/messages";
import { loadValue } from "devtools/packages/devtools-reps/object-inspector/items/utils";
import { TestMessageHandlers } from "ui/actions/find-tests";
import { LogpointHandlers } from "ui/actions/logpoint";
import { client } from "protocol/socket";
import { Pause, ValueFront, ThreadFront as ThreadFrontType } from "protocol/thread";
import { WiredMessage, wireUpMessage } from "protocol/thread/thread";
import type { UIStore, UIThunkAction } from "ui/actions";
import { onConsoleOverflow } from "ui/actions/session";
import { pointsReceived } from "ui/reducers/timeline";
import { FocusRegion, UnsafeFocusRegion } from "ui/state/timeline";
import { isFocusRegionSubset } from "ui/utils/timeline";

import {
  clearMessages,
  logpointMessagesCleared,
  Message as InternalMessage,
  messagesAdded,
  messageClosed,
  messageEvaluationsCleared,
  messageOpened,
  setConsoleOverflowed,
  setLastFetchedForFocusRegion,
  setMessagesLoaded,
} from "../reducers/messages";
import { getConsoleOverflow, getLastFetchedForFocusRegion, getMessagesLoaded } from "../selectors";

const defaultIdGenerator = new IdGenerator();
let queuedMessages: unknown[] = [];
let throttledDispatchPromise: Promise<void> | null = null;

export function setupMessages(store: UIStore, ThreadFront: typeof ThreadFrontType) {
  LogpointHandlers.onPointLoading = (logGroupId, point, time, location) =>
    store.dispatch(onLogpointLoading(logGroupId, point, time, location));
  LogpointHandlers.onResult = (logGroupId, point, time, location, pause, values) =>
    store.dispatch(onLogpointResult(logGroupId, point, time, location, pause, values));
  LogpointHandlers.clearLogpoint = logGroupId => store.dispatch(messagesClearLogpoint(logGroupId));
  TestMessageHandlers.onTestMessage = msg => store.dispatch(onConsoleMessage(msg));

  ThreadFront.findConsoleMessages(
    (_, msg) => store.dispatch(onConsoleMessage(msg)),
    () => store.dispatch(onConsoleOverflow())
  ).then(() => store.dispatch(setMessagesLoaded(true)), Sentry.captureException);
}

function convertStack(
  stack: string[],
  { frames }: { frames?: Frame[] },
  ThreadFront: typeof ThreadFrontType
) {
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

export function onConsoleMessage(msg: WiredMessage): UIThunkAction {
  return async (dispatch, getState, { ThreadFront }) => {
    const stacktrace = await convertStack(msg.stack!, msg.data, ThreadFront);
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

    if (msg.argumentValues) {
      await Promise.all(msg.argumentValues.map(loadValue));
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
  return async (dispatch, getState, { ThreadFront }) => {
    const packet = {
      errorMessage: "Loading…",
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
  values?: ValueFront[]
): UIThunkAction {
  return async (dispatch, getState, { ThreadFront }) => {
    if (values) {
      await Promise.all(values.map(loadValue));
    }
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
    dispatch(
      pointsReceived(
        messages
          .filter(p => p.executionPoint && p.executionPointTime)
          .map(p => ({ time: p.executionPointTime!, point: p.executionPoint! }))
      )
    );
    dispatch(messagesAdded(messages));
  };
}

export const messagesClearEvaluations = messageEvaluationsCleared;
export const messagesClearLogpoint = logpointMessagesCleared;
export const messageOpen = messageOpened;
export const messageClose = messageClosed;

export function refetchMessages(focusRegion: FocusRegion | null): UIThunkAction {
  return async (dispatch, getState, { ThreadFront }) => {
    const state = getState();
    const didOverflow = getConsoleOverflow(state);
    const lastFetchedForFocusRegion = getLastFetchedForFocusRegion(state);
    const messagesLoaded = getMessagesLoaded(state);

    // Soft Focus: The frontend only needs to refetch data if:
    // 1. The most recent time it requested data "overflowed" (too many messages to send them all), or
    // 2. The new focus region is outside of the most recent region we fetched messages for.
    //
    // There are two things to note about the second bullet point above:
    // 1. When devtools is first opened, there is no focused region.
    //    This is equivalent to focusing on the entire timeline, so we often won't need to refetch messages when focusing for the first time.
    // 2. We shouldn't compare the new focus region to the most recent focus region,
    //    but rather to the most recent focus region that we fetched messages for (the entire timeline in many cases).
    //    If we don't need to refetch after zooming in, then we won't need to refetch after zooming back out either,
    //    (unless our fetches have overflowed at some point).
    if (
      messagesLoaded &&
      !didOverflow &&
      isFocusRegionSubset(lastFetchedForFocusRegion, focusRegion)
    ) {
      // We already have all of the console logs for the new region.
      // We can skip running a new analysis.
      return;
    }

    dispatch(clearMessages());

    const sessionEndpoint = await client.Session.getEndpoint({}, ThreadFront.sessionId!);
    const begin = focusRegion ? (focusRegion as UnsafeFocusRegion).start.point : "0";
    const end = focusRegion
      ? (focusRegion as UnsafeFocusRegion).end.point
      : sessionEndpoint.endpoint.point;

    const { messages, overflow } = await client.Console.findMessagesInRange(
      { range: { begin, end } },
      ThreadFront.sessionId!
    );

    // Store the result of the new analysis window for "soft focus" comparison next time.
    dispatch(setLastFetchedForFocusRegion(focusRegion));
    dispatch(setConsoleOverflowed(overflow === true));

    messages.forEach(message => {
      wireUpMessage(message);

      dispatch(onConsoleMessage(message as WiredMessage));
    });

    dispatch(setMessagesLoaded(true));
  };
}
