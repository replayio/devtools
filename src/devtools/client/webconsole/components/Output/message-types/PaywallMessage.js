/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import useAuth0 from "ui/utils/useAuth0";

// React & Redux
const React = require("react");
const PropTypes = require("prop-types");
const Message = require("devtools/client/webconsole/components/Output/Message");

PaywallMessage.propTypes = {
  message: PropTypes.object.isRequired,
  timestampsVisible: PropTypes.bool.isRequired,
  maybeScrollToBottom: PropTypes.func,
  topLevelClassName: PropTypes.string,
};

/**
 * Displays input from the console.
 */
export default function PaywallMessage(props) {
  const { message, timestampsVisible, maybeScrollToBottom, isPaused, dispatch, topLevelClassName } =
    props;
  const { indent, source, level, timeStamp, executionPointTime } = message;
  const { isAuthenticated } = useAuth0();

  return React.createElement(Message, {
    source,
    type: "paywall",
    level,
    topLevelClasses: topLevelClassName ? [topLevelClassName] : [],
    messageBody: React.createElement("span", {
      className: "text-gray-500 font-bold",
      children: "Evaluations are only available for Developers in the Team plan.",
    }),
    indent,
    timeStamp,
    timestampsVisible,
    executionPointTime,
    maybeScrollToBottom,
    message,
    isAuthenticated,
    isPaused,
    dispatch,
  });
}
