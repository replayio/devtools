/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// React & Redux
const { createFactory } = require("react");
const PropTypes = require("prop-types");
const Message = createFactory(require("devtools/client/webconsole/components/Output/Message"));
const GripMessageBody = require("devtools/client/webconsole/components/Output/GripMessageBody");

EvaluationResult.displayName = "EvaluationResult";

EvaluationResult.propTypes = {
  dispatch: PropTypes.func.isRequired,
  message: PropTypes.object.isRequired,
  timestampsVisible: PropTypes.bool.isRequired,
  maybeScrollToBottom: PropTypes.func,
  open: PropTypes.bool,
};

EvaluationResult.defaultProps = {
  open: false,
};

function EvaluationResult(props) {
  const {
    dispatch,
    message,
    timestampsVisible,
    maybeScrollToBottom,
    open,
    recordingId,
    isPaused,
  } = props;

  const {
    source,
    type,
    level,
    id: messageId,
    indent,
    exceptionDocURL,
    stacktrace,
    frame,
    timeStamp,
    executionPointTime,
    parameters,
    notes,
  } = message;

  let messageBody;
  if (typeof message.messageText !== "undefined" && message.messageText !== null) {
    const messageText =
      message.messageText && message.messageText.getGrip
        ? message.messageText.getGrip()
        : message.messageText;
    if (typeof messageText === "string") {
      messageBody = messageText;
    } else if (typeof messageText === "object" && messageText.type === "longString") {
      messageBody = `${messageText.initial}…`;
    }
  } else {
    messageBody = GripMessageBody({
      dispatch,
      messageId,
      grip: parameters[0],
      useQuotes: true,
      escapeWhitespace: false,
      type,
      maybeScrollToBottom,
    });
  }

  const topLevelClasses = ["cm-s-mozilla"];

  return Message({
    dispatch,
    source,
    type,
    level,
    indent,
    topLevelClasses,
    messageBody,
    messageId,
    exceptionDocURL,
    stacktrace,
    recordingId,
    collapsible: Array.isArray(stacktrace),
    open,
    frame,
    timeStamp,
    executionPointTime,
    parameters,
    notes,
    timestampsVisible,
    maybeScrollToBottom,
    message,
    isPaused,
  });
}

module.exports = EvaluationResult;
