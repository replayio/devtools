/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const { isError } = require("devtools/client/webconsole/utils/messages");
const { pointPrecedes } = require("protocol/execution-point-utils");
const { MESSAGE_TYPE } = require("devtools/client/webconsole/constants");
const { getCurrentTime, getTrimRegion } = require("ui/reducers/timeline");
const { getExecutionPoint } = require("devtools/client/debugger/src/reducers/pause");
const { isInTrimSpan } = require("ui/utils/timeline");
const { features } = require("ui/utils/prefs");

import { createSelector } from "reselect";

export const getAllMessagesPayloadById = state => state.messages.messagesPayloadById;
export const getAllMessagesUiById = state => state.messages.messagesUiById;
export const getAllRepeatById = state => state.messages.repeatById;
export const getCommandHistory = state => state.messages.commandHistory;
export const getFilteredMessagesCount = state => state.messages.filteredMessagesCount;

function messageTime(msg) {
  const { executionPointTime, lastExecutionPoint } = msg;
  return executionPointTime || (lastExecutionPoint && lastExecutionPoint.time) || 0;
}

export function getAllMessagesById(state) {
  return state.messages.messagesById;
}

export const getVisibleMessages = createSelector(
  getAllMessagesById,
  state => state.messages.visibleMessages,
  state => state.consoleUI.zoomStartTime,
  state => state.consoleUI.zoomEndTime,
  getTrimRegion,
  (messages, visibleMessages, zoomStartTime, zoomEndTime, trimRegion) => {
    const msgs = visibleMessages.filter(id => {
      const msg = messages.get(id);
      const time = messageTime(msg);
      return time >= zoomStartTime && time <= zoomEndTime;
    });

    if (trimRegion && features.trimming) {
      return msgs.filter(id => {
        const msg = messages.get(id);
        return isInTrimSpan(msg.executionPointTime, trimRegion);
      });
    }

    return msgs;
  }
);

export const getMessages = createSelector(
  getAllMessagesById,
  getVisibleMessages,
  (messagesById, visibleMessages) => visibleMessages.map(id => messagesById.get(id))
);

export const getMessagesForTimeline = createSelector(getMessages, messages =>
  messages.filter(message => message.source == "console-api" || isError(message))
);

function messageExecutionPoint(msg) {
  const { executionPoint, lastExecutionPoint } = msg;
  return executionPoint || (lastExecutionPoint && lastExecutionPoint.point);
}

export const getClosestMessage = createSelector(
  getVisibleMessages,
  getAllMessagesById,
  getExecutionPoint,
  getCurrentTime,
  (visibleMessages, messages, executionPoint, currentTime) => {
    if ((!executionPoint && !currentTime) || !visibleMessages || !visibleMessages.length) {
      return null;
    }

    // If the pause location is before the first message, the first message is
    // marked as the paused one. This allows later messages to be grayed out but
    // isn't consistent with behavior for those other messages.
    let last = messages.get(visibleMessages[0]);

    for (const id of visibleMessages) {
      const msg = messages.get(id);

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

export function getMessage(state, id) {
  return getAllMessagesById(state).get(id);
}

export function hasPendingLogGroupIds(state) {
  return !!state.messages.pendingLogGroupIds.size;
}
