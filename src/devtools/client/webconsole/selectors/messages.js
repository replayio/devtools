/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const { getWarningGroupType } = require("devtools/client/webconsole/utils/messages");
const {
  getParentWarningGroupMessageId,
  isError,
} = require("devtools/client/webconsole/utils/messages");
import { createSelector } from "reselect";

export function getAllMessagesById(state) {
  return state.messages.messagesById;
}

export const getMessages = createSelector(
  getAllMessagesById,
  getVisibleMessages,
  (messagesById, visibleMessages) => visibleMessages.map(id => messagesById.get(id))
);

export const getMessagesForTimeline = createSelector(getMessages, messages =>
  messages.filter(message => message.source == "console-api" || isError(message))
);

export function getMessage(state, id) {
  return getAllMessagesById(state).get(id);
}

export function getAllMessagesUiById(state) {
  return state.messages.messagesUiById;
}
export function getAllMessagesPayloadById(state) {
  return state.messages.messagesPayloadById;
}

export function getAllGroupsById(state) {
  return state.messages.groupsById;
}

export function getCurrentGroup(state) {
  return state.messages.currentGroup;
}

export function getVisibleMessages(state) {
  return state.messages.visibleMessages;
}

export function getFilteredMessagesCount(state) {
  return state.messages.filteredMessagesCount;
}

export function getAllRepeatById(state) {
  return state.messages.repeatById;
}

export function getGroupsById(state) {
  return state.messages.groupsById;
}

export function getPausedExecutionPoint(state) {
  return state.messages.pausedExecutionPoint;
}

export function getPausedExecutionPointTime(state) {
  return state.messages.pausedExecutionPointTime;
}

export function getAllWarningGroupsById(state) {
  return state.messages.warningGroupsById;
}

export function isMessageInWarningGroup(message, visibleMessages = []) {
  if (!getWarningGroupType(message)) {
    return false;
  }

  return visibleMessages.includes(getParentWarningGroupMessageId(message));
}
