/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// React & Redux
const React = require("react");
const PropTypes = require("prop-types");
const dom = require("react-dom-factories");
const GripMessageBody =
  require("devtools/client/webconsole/components/Output/GripMessageBody").default;
const ConsoleTable = require("devtools/client/webconsole/components/Output/ConsoleTable");
const { isGroupType, l10n } = require("devtools/client/webconsole/utils/messages");

const Message = require("devtools/client/webconsole/components/Output/Message");

ConsoleApiCall.propTypes = {
  dispatch: PropTypes.func.isRequired,
  isPrimaryHighlighted: PropTypes.bool.isRequired,
  maybeScrollToBottom: PropTypes.func,
  message: PropTypes.object.isRequired,
  open: PropTypes.bool,
  shouldScrollIntoView: PropTypes.bool.isRequired,
  timestampsVisible: PropTypes.bool.isRequired,
  topLevelClassName: PropTypes.string,
};

ConsoleApiCall.defaultProps = {
  open: false,
};

export default function ConsoleApiCall(props) {
  const {
    dispatch,
    isFirstMessageForPoint,
    isPaused,
    isPrimaryHighlighted,
    maybeScrollToBottom,
    message,
    open,
    pausedExecutionPoint,
    payload,
    prefixBadge,
    repeat,
    shouldScrollIntoView,
    timestampsVisible,
    topLevelClassName,
  } = props;
  const {
    id: messageId,
    executionPoint,
    executionPointTime,
    executionPointHasFrames,
    indent,
    source,
    type,
    level,
    stacktrace,
    frame,
    timeStamp,
    parameters,
    messageText,
    prefix,
    userProvidedStyles,
  } = message;

  let messageBody;
  const messageBodyConfig = {
    dispatch,
    maybeScrollToBottom,
    messageId,
    parameters,
    type,
    userProvidedStyles,
  };

  if (type === "trace") {
    const traceParametersBody =
      Array.isArray(parameters) && parameters.length > 0
        ? [" "].concat(formatReps(messageBodyConfig))
        : [];

    messageBody = [
      dom.span({ className: "cm-variable" }, "console.trace()"),
      ...traceParametersBody,
    ];
  } else if (type === "assert") {
    const reps = formatReps(messageBodyConfig);
    messageBody = dom.span({}, "Assertion failed: ", reps);
  } else if (type === "table") {
    // TODO: Chrome does not output anything, see if we want to keep this
    messageBody = dom.span({ className: "cm-variable" }, "console.table()");
  } else if (parameters) {
    messageBody = formatReps(messageBodyConfig);
    if (prefix) {
      messageBody.unshift(
        dom.span(
          {
            className: "console-message-prefix",
          },
          `${prefix}: `
        )
      );
    }
  } else if (typeof messageText === "string") {
    messageBody = messageText;
  } else if (messageText) {
    messageBody = React.createElement(GripMessageBody, {
      dispatch,
      messageId,
      grip: messageText,
      useQuotes: false,
      transformEmptyString: true,
      type,
    });
  }

  let attachment = null;
  if (type === "table") {
    attachment = React.createElement(ConsoleTable, {
      dispatch,
      id: message.id,
      parameters: message.parameters,
      tableData: payload,
    });
  }

  let collapseTitle = null;
  if (isGroupType(type)) {
    collapseTitle = "Show/hide group";
  }

  const collapsible = isGroupType(type) || (level === "error" && Array.isArray(stacktrace));
  const topLevelClasses = ["cm-s-mozilla"];
  if (topLevelClassName) {
    topLevelClasses.push(topLevelClassName);
  }
  return React.createElement(Message, {
    attachment,
    collapseTitle,
    collapsible,
    dispatch,
    executionPoint,
    executionPointHasFrames,
    executionPointTime,
    frame,
    indent,
    isFirstMessageForPoint,
    isPaused,
    isPrimaryHighlighted,
    level,
    maybeScrollToBottom,
    message,
    messageBody,
    messageId,
    open,
    parameters,
    pausedExecutionPoint,
    prefixBadge,
    repeat,
    shouldScrollIntoView,
    source,
    stacktrace,
    timeStamp,
    timestampsVisible,
    topLevelClasses,
    type,
  });
}

function formatReps(options = {}) {
  const {
    dispatch,
    loadedObjectProperties,
    loadedObjectEntries,
    messageId,
    parameters,
    userProvidedStyles,
    type,
    maybeScrollToBottom,
  } = options;

  return (
    parameters
      // Get all the grips.
      .map((grip, key) =>
        React.createElement(GripMessageBody, {
          dispatch,
          messageId,
          grip,
          key,
          userProvidedStyle: userProvidedStyles ? userProvidedStyles[key] : null,
          useQuotes: false,
          loadedObjectProperties,
          loadedObjectEntries,
          type,
          maybeScrollToBottom,
        })
      )
      // Interleave spaces.
      .reduce((arr, v, i) => {
        // We need to interleave a space if we are not on the last element AND
        // if we are not between 2 messages with user provided style.
        const needSpace =
          i + 1 < parameters.length &&
          (!userProvidedStyles ||
            userProvidedStyles[i] === undefined ||
            userProvidedStyles[i + 1] === undefined);

        return needSpace ? arr.concat(v, " ") : arr.concat(v);
      }, [])
  );
}
