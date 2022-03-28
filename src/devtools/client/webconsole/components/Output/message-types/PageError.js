/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// React & Redux
const React = require("react");
const PropTypes = require("prop-types");
const Message = require("devtools/client/webconsole/components/Output/Message");
const { createPrimitiveValueFront } = require("protocol/thread");

const { REPS, MODE } = require("devtools/packages/devtools-reps");

PageError.displayName = "PageError";

PageError.propTypes = {
  message: PropTypes.object.isRequired,
  open: PropTypes.bool,
  timestampsVisible: PropTypes.bool.isRequired,
  maybeScrollToBottom: PropTypes.func,
};

PageError.defaultProps = {
  open: false,
};

function PageError(props) {
  const {
    dispatch,
    message,
    open,
    repeat,
    timestampsVisible,
    isPaused,
    maybeScrollToBottom,
    pausedExecutionPoint,
    isFirstMessageForPoint,
  } = props;
  const {
    id: messageId,
    executionPoint,
    executionPointTime,
    executionPointHasFrames,
    source,
    type,
    level,
    messageText,
    stacktrace,
    frame,
    exceptionDocURL,
    timeStamp,
    notes,
  } = message;

  const messageBody = REPS.StringRep.rep({
    object: createPrimitiveValueFront(messageText),
    mode: MODE.LONG,
    useQuotes: false,
    escapeWhitespace: false,
    urlCropLimit: 120,
  });

  return React.createElement(Message, {
    dispatch,
    messageId,
    executionPoint,
    executionPointTime,
    executionPointHasFrames,
    isPaused,
    open,
    collapsible: Array.isArray(stacktrace),
    source,
    type,
    level,
    topLevelClasses: [],
    indent: message.indent,
    messageBody,
    repeat,
    frame,
    stacktrace,
    exceptionDocURL,
    timeStamp,
    notes,
    timestampsVisible,
    maybeScrollToBottom,
    message,
    pausedExecutionPoint,
    isFirstMessageForPoint,
  });
}

module.exports = PageError;
