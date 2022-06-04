/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createSelector } from "reselect";

import type { UIState } from "ui/state";
import { endTimeForFocusRegion, startTimeForFocusRegion } from "ui/utils/timeline";
import type { Message } from "../reducers/messages";
import { messagesAdapter } from "../reducers/messages";

const { isError } = require("devtools/client/webconsole/utils/messages");
const { pointPrecedes } = require("protocol/execution-point-utils");
const { MESSAGE_TYPE } = require("devtools/client/webconsole/constants");
const { getCurrentTime, getFocusRegion } = require("ui/reducers/timeline");
const { getExecutionPoint } = require("devtools/client/debugger/src/reducers/pause");

export const getAllMessagesUiById = (state: UIState) => state.messages.messagesUiById;
export const getCommandHistory = (state: UIState) => state.messages.commandHistory;
export const getFilteredMessagesCount = (state: UIState) => state.messages.filteredMessagesCount;
export const getMessagesLoaded = (state: UIState) => state.messages.messagesLoaded;
export const getLastMessageId = (state: UIState) =>
  state.messages.messages.ids[state.messages.messages.ids.length - 1];
export const getAllFilters = (state: UIState) => state.messages.filters;

export function getAllMessagesById(state: UIState) {
  return state.messages.messages;
}

export const { selectTotal: getTotalMessagesCount } = messagesAdapter.getSelectors(
  (state: UIState) => state.messages.messages
);

export const getVisibleMessageData = createSelector(
  getAllMessagesById,
  (state: UIState) => state.messages.visibleMessages,
  getFocusRegion,
  getLastFetchedForFocusRegion,
  getConsoleOverflow,
  (state: UIState) => state.app.loadedRegions,
  (
    messages,
    visibleMessages,
    focusRegion,
    lastFetchedFocusRange,
    lastFetchDidOverflow,
    loadedRegions
  ) => {
    const filteredMessageIDs: string[] = [];

    // We can only reliably show counts for the number of messages filtered (before/after) if:
    // 1) We're doing in-memory filtering for the entire recording (aka no focus mode) and
    // 2) Our request to fetch all messages didn't overflow (so we're filtering the entire set of them).
    //
    // Otherwise the best thing we can show is a "maybe".
    const canShowCount = lastFetchedFocusRange === null && !lastFetchDidOverflow;

    let countAfter = 0;
    let countBefore = 0;

    const focusRegionStartTime = focusRegion ? startTimeForFocusRegion(focusRegion) : null;
    const focusRegionEndTime = focusRegion ? endTimeForFocusRegion(focusRegion) : null;

    visibleMessages.forEach(messageID => {
      const message = messages.entities[messageID]!;
      const messageTime = message.executionPointTime!;

      // Filter out messages that aren't within the focused region.
      if (focusRegion) {
        if (messageTime < (focusRegionStartTime as number)) {
          countBefore++;
          return;
        } else if (messageTime > (focusRegionEndTime as number)) {
          countAfter++;
          return;
        }
      }

      filteredMessageIDs.push(messageID);
    });

    return {
      countAfter: canShowCount ? countAfter : -1,
      countBefore: canShowCount ? countBefore : -1,
      messageIDs: filteredMessageIDs,
    };
  }
);

export const getMessages = createSelector(
  getAllMessagesById,
  getVisibleMessageData,
  (messagesById, visibleMessages) =>
    visibleMessages.messageIDs.map(id => messagesById.entities[id]!)
);

export const getMessagesForTimeline = createSelector(getMessages, messages =>
  messages.filter(message => message!.source == "console-api" || isError(message))
);

function messageExecutionPoint(msg: Message) {
  const { executionPoint, lastExecutionPoint } = msg;
  return executionPoint || (lastExecutionPoint && lastExecutionPoint.point);
}

export const getClosestMessage = createSelector(
  getVisibleMessageData,
  getAllMessagesById,
  getExecutionPoint,
  getCurrentTime,
  (visibleMessages, messages, executionPoint, currentTime) => {
    const messageIDs = visibleMessages?.messageIDs;
    if ((!executionPoint && !currentTime) || !messageIDs || !messageIDs.length) {
      return null;
    }

    // If the pause location is before the first message, the first message is
    // marked as the paused one. This allows later messages to be grayed out but
    // isn't consistent with behavior for those other messages.
    let last = messages.entities[messageIDs[0]]!;

    for (const id of messageIDs) {
      const msg = messages.entities[id]!;

      // Skip evaluations, which will always occur at the same evaluation point as
      // a logpoint or log
      if (msg.type == MESSAGE_TYPE.COMMAND || msg.type == MESSAGE_TYPE.RESULT) {
        continue;
      }

      const point = messageExecutionPoint(msg);
      const time = msg.executionPointTime;
      if (executionPoint) {
        if (point && pointPrecedes(executionPoint, point)) {
          break;
        }
      } else {
        if (time && currentTime < time) {
          break;
        }
      }

      last = msg;
    }

    return last;
  }
);

export function getMessage(state: UIState, id: string) {
  return getAllMessagesById(state).entities[id];
}

export function getLastFetchedForFocusRegion(state: UIState) {
  return state.messages.lastFetchedForFocusRegion;
}

export function getConsoleOverflow(state: UIState) {
  return state.messages.overflow;
}

export function getExceptionLogpointError(state: UIState) {
  return state.messages.exceptionLogpointError;
}
