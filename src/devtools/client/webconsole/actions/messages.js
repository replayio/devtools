/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const { prepareMessage } = require("devtools/client/webconsole/utils/messages");
const { IdGenerator } = require("devtools/client/webconsole/utils/id-generator");

const {
  MESSAGES_ADD,
  MESSAGES_CLEAR,
  MESSAGES_CLEAR_LOGPOINT,
  MESSAGE_OPEN,
  MESSAGE_CLOSE,
  MESSAGE_UPDATE_PAYLOAD,
  PAUSED_EXECUTION_POINT,
  MESSAGES_CLEAR_EVALUATIONS,
  MESSAGES_CLEAR_EVALUATION,
} = require("devtools/client/webconsole/constants");

const defaultIdGenerator = new IdGenerator();

function messagesAdd(packets, idGenerator = null) {
  if (idGenerator == null) {
    idGenerator = defaultIdGenerator;
  }
  const messages = packets.map(packet => prepareMessage(packet, idGenerator));

  // When this is used for non-cached messages then handle clear message and
  // split up into batches
  return {
    type: MESSAGES_ADD,
    messages,
  };
}

function messagesClear() {
  return {
    type: MESSAGES_CLEAR,
  };
}

function messagesClearEvaluations() {
  return {
    type: MESSAGES_CLEAR_EVALUATIONS,
  };
}

function messagesClearEvaluation(messageId, messageType) {
  // The messageType is only used for logging purposes to determine what type of messages
  // are typically cleared.
  return {
    type: MESSAGES_CLEAR_EVALUATION,
    messageId,
    messageType,
  };
}

function messagesClearLogpoint(logpointId) {
  return {
    type: MESSAGES_CLEAR_LOGPOINT,
    logpointId,
  };
}

function setPauseExecutionPoint(executionPoint, time) {
  return {
    type: PAUSED_EXECUTION_POINT,
    executionPoint,
    time,
  };
}

function messageOpen(id) {
  return {
    type: MESSAGE_OPEN,
    id,
  };
}

function messageClose(id) {
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
function messageUpdatePayload(id, data) {
  return {
    type: MESSAGE_UPDATE_PAYLOAD,
    id,
    data,
  };
}

function jumpToExecutionPoint(executionPoint) {
  return ({ client }) => {
    client.timeWarp(executionPoint);
  };
}

module.exports = {
  messagesAdd,
  messagesClear,
  messagesClearEvaluations,
  messagesClearEvaluation,
  messagesClearLogpoint,
  messageOpen,
  messageClose,
  messageUpdatePayload,
  // for test purpose only.
  setPauseExecutionPoint,
  jumpToExecutionPoint,
};
