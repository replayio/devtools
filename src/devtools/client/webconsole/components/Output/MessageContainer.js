/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const React = require("react");
const PropTypes = require("prop-types");

import PaywallMessage from "./message-types/PaywallMessage";
import ConsoleApiCall from "./message-types/ConsoleApiCall";
import ConsoleCommand from "./message-types/ConsoleCommand";
import DefaultRenderer from "./message-types/DefaultRenderer";
import EvaluationResult from "./message-types/EvaluationResult";
import PageError from "./message-types/PageError";

import styles from "./MessageContainer.module.css";
import { StateContext } from "../Search";

const { MESSAGE_SOURCE, MESSAGE_TYPE } = require("devtools/client/webconsole/constants");

export class MessageContainer extends React.Component {
  static get propTypes() {
    return {
      badge: PropTypes.number,
      indent: PropTypes.number,
      isPaused: PropTypes.bool.isRequired,
      isPrimaryHighlighted: PropTypes.bool.isRequired,
      messageId: PropTypes.string.isRequired,
      open: PropTypes.bool.isRequired,
      pausedExecutionPoint: PropTypes.string,
      payload: PropTypes.object,
      repeat: PropTypes.number,
      shouldScrollIntoView: PropTypes.bool.isRequired,
      timestampsVisible: PropTypes.bool,
    };
  }

  static contextType = StateContext;

  static get defaultProps() {
    return {
      open: false,
    };
  }

  shouldComponentUpdate(nextProps) {
    const triggeringUpdateProps = [
      "repeat",
      "open",
      "payload",
      "prefixBadge",
      "timestampsVisible",
      "isPaused",
      "pausedExecutionPoint",
      "badge",
      "isPrimaryHighlighted",
      "shouldScrollIntoView",
    ];

    return triggeringUpdateProps.some(prop => this.props[prop] !== nextProps[prop]);
  }

  render() {
    const message = this.props.message;
    const MessageComponent = getMessageComponent(message);

    let topLevelClassName = null;
    const { index, results, visible } = this.context;

    // Highlight this row if the console search UI is visible/active and it is the currently selected result.
    if (visible && index >= 0 && index < results.length && message === results[index]) {
      topLevelClassName = styles.CurrentSearchResult;
    }

    return (
      <MessageComponent {...this.props} message={message} topLevelClassName={topLevelClassName} />
    );
  }
}

function getMessageComponent(message) {
  if (!message) {
    return DefaultRenderer;
  }

  switch (message.source) {
    case MESSAGE_SOURCE.CONSOLE_API:
      return message.paywall ? PaywallMessage : ConsoleApiCall;
    case MESSAGE_SOURCE.JAVASCRIPT:
      switch (message.type) {
        case MESSAGE_TYPE.COMMAND:
          return ConsoleCommand;
        case MESSAGE_TYPE.RESULT:
          return EvaluationResult;
        // @TODO this is probably not the right behavior, but works for now.
        // Chrome doesn't distinguish between page errors and log messages. We
        // may want to remove the PageError component and just handle errors
        // with ConsoleApiCall.
        case MESSAGE_TYPE.LOG:
          return PageError;
        default:
          return DefaultRenderer;
      }
  }

  return DefaultRenderer;
}
