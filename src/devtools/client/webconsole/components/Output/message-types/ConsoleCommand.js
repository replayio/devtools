/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// React & Redux
const React = require("react");
const PropTypes = require("prop-types");
const Message = require("devtools/client/webconsole/components/Output/Message");
ConsoleCommand.displayName = "ConsoleCommand";

ConsoleCommand.propTypes = {
  message: PropTypes.object.isRequired,
  timestampsVisible: PropTypes.bool.isRequired,
  maybeScrollToBottom: PropTypes.func,
};

/**
 * Displays input from the console.
 */
export default function ConsoleCommand(props) {
  const { message, timestampsVisible, maybeScrollToBottom, isPaused, dispatch } = props;
  const { indent, source, type, level, timeStamp, executionPointTime } = message;
  const messageText = trimCode(message.messageText);

  // This uses a Custom Element to syntax highlight when possible. If it's not
  // (no CodeMirror editor), then it will just render text.
  const messageBody = React.createElement("syntax-highlighted", null, messageText);

  return React.createElement(Message, {
    source,
    type,
    level,
    topLevelClasses: [],
    messageBody,
    indent,
    timeStamp,
    timestampsVisible,
    executionPointTime,
    maybeScrollToBottom,
    message,
    isPaused,
    dispatch,
  });
}

/**
 * Trim user input to avoid blank lines before and after messages
 */
function trimCode(input) {
  if (typeof input !== "string") {
    return input;
  }

  // Trim on both edges if we have a single line of content
  if (input.trim().includes("\n") === false) {
    return input.trim();
  }

  // For multiline input we want to keep the indentation of the first line
  // with non-whitespace, so we can't .trim()/.trimStart().
  return input.replace(/^\s*\n/, "").trimEnd();
}
