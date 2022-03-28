/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import type { UIState } from "ui/state";
import type { Message } from "../reducers/messages";

const { isError } = require("devtools/client/webconsole/utils/messages");
const { pointPrecedes } = require("protocol/execution-point-utils");
const { MESSAGE_TYPE } = require("devtools/client/webconsole/constants");
const { getCurrentTime, getFocusRegion } = require("ui/reducers/timeline");
const { getExecutionPoint } = require("devtools/client/debugger/src/reducers/pause");
const { isInTrimSpan } = require("ui/utils/timeline");

import { createSelector } from "reselect";

export const getAllMessagesUiById = (state: UIState) => state.messages.messagesUiById;
export const getCommandHistory = (state: UIState) => state.messages.commandHistory;
export const getFilteredMessagesCount = (state: UIState) => state.messages.filteredMessagesCount;
export const getMessagesLoaded = (state: UIState) => state.messages.messagesLoaded;

export function getAllMessagesById(state: UIState) {
  return state.messages.messagesById;
}

export const getVisibleMessages = createSelector(
  getAllMessagesById,
  (state: UIState) => state.messages.visibleMessages,
  getFocusRegion,
  (messages, visibleMessages, focusRegion) => {
    const msgs = visibleMessages;

    if (focusRegion) {
      return msgs.filter(id => {
        const msg = messages.get(id)!;
        return isInTrimSpan(msg.executionPointTime, focusRegion);
      });
    }

    return msgs;
  }
);

export const getMessages = createSelector(
  getAllMessagesById,
  getVisibleMessages,
  (messagesById, visibleMessages) => visibleMessages.map(id => messagesById.get(id)!)
);

export const getMessagesForTimeline = createSelector(getMessages, messages =>
  messages.filter(message => message.source == "console-api" || isError(message))
);

function messageExecutionPoint(msg: Message) {
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
      const msg = messages.get(id)!;

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
  return getAllMessagesById(state).get(id);
}

export function getConsoleOverflow(state: UIState) {
  return state.messages.overflow;
}
