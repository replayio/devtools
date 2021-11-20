/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const { Component, createElement } = require("react");
const dom = require("react-dom-factories");
const { connect } = require("devtools/client/shared/redux/visibility-handler-connect");
const { actions } = require("ui/actions");
const { isVisible } = require("ui/utils/dom");
const ReactDOM = require("react-dom");
const { selectors } = require("ui/reducers");
const { isDemo } = require("ui/utils/environment");

const PropTypes = require("prop-types");
const {
  MessageContainer,
} = require("devtools/client/webconsole/components/Output/MessageContainer");

const { MESSAGE_TYPE } = require("devtools/client/webconsole/constants");

class ConsoleOutput extends Component {
  static get propTypes() {
    return {
      messages: PropTypes.object.isRequired,
      messagesUi: PropTypes.array.isRequired,
      timestampsVisible: PropTypes.bool,
      messagesPayload: PropTypes.object.isRequired,
      visibleMessages: PropTypes.array.isRequired,
      pausedExecutionPoint: PropTypes.string,
    };
  }

  componentDidMount() {
    if (this.props.visibleMessages.length > 0) {
      scrollToBottom(this.outputNode);
    }
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.pausedExecutionPoint != prevProps.pausedExecutionPoint &&
      this.props.closestMessage != prevProps.closestMessage
    ) {
      return this.scrollToClosestMessage();
    }

    this.maybeScrollToResult(prevProps);
  }

  scrollToClosestMessage() {
    const { closestMessage } = this.props;

    if (!closestMessage || isDemo()) {
      return;
    }

    const outputNode = ReactDOM.findDOMNode(this);
    const element = outputNode.querySelector(`.message[data-message-id="${closestMessage.id}"]`);

    if (!element) {
      return;
    }

    // Don't scroll to the message if it's already in view.
    if (isVisible(outputNode, element)) {
      return;
    }

    // Chrome sometimes ignores element.scrollIntoView() here,
    // calling it with a little delay fixes it
    setTimeout(() => element.scrollIntoView({ block: "center", behavior: "smooth" }));
  }

  maybeScrollToResult(prevProps) {
    const messagesDelta = this.props.messages.size - prevProps.messages.size;

    // [...this.props.messages.values()] seems slow
    // we should have a separate messageList somewhere we can check OR
    // use a memoization function to be able to get the last message quickly
    const lastMessage = [...this.props.messages.values()][this.props.messages.size - 1];

    if (messagesDelta <= 0 || lastMessage.type !== MESSAGE_TYPE.RESULT) {
      return;
    }

    const node = ReactDOM.findDOMNode(this);
    const resultNode = node.querySelector(`div[data-message-id='${lastMessage.id}']`);

    if (!resultNode) {
      return;
    }

    // Don't scroll to the evaluation result if it's already in view.
    if (isVisible(node, resultNode)) {
      return;
    }

    // Scroll to the previous message node if it exists. It should be the
    // input which triggered the evaluation result we're scrolling to.
    const previous = resultNode.previousSibling;
    (previous || resultNode).scrollIntoView();
  }

  getIsFirstMessageForPoint(index, visibleMessages) {
    const { messages } = this.props;

    if (index == 0) {
      return true;
    }

    let previousMessage = messages.get(visibleMessages[index - 1]);
    let currentMessage = messages.get(visibleMessages[index]);

    if (!previousMessage || !currentMessage) {
      return false;
    }

    return previousMessage.executionPoint !== currentMessage.executionPoint;
  }

  render() {
    let {
      dispatch,
      visibleMessages,
      messages,
      messagesUi,
      messagesPayload,
      timestampsVisible,
      pausedExecutionPoint,
      closestMessage,
      hoveredItem,
      loadedRegions,
    } = this.props;

    const messageNodes = visibleMessages
      .filter(messageId => {
        const time = messages.get(messageId).executionPointTime;
        return loadedRegions.loaded.some(
          region => time >= region.begin.time && time <= region.end.time
        );
      })
      .map((messageId, i) => {
        const message = messages.get(messageId);
        const isPrimaryHighlighted = hoveredItem?.point === message.executionPoint;
        const shouldScrollIntoView = isPrimaryHighlighted && hoveredItem?.target !== "console";

        return createElement(MessageContainer, {
          dispatch,
          key: messageId,
          messageId,
          message,
          open: messagesUi.includes(messageId),
          payload: messagesPayload.get(messageId),
          timestampsVisible,

          pausedExecutionPoint,
          isPaused: closestMessage?.id == messageId,
          isFirstMessageForPoint: this.getIsFirstMessageForPoint(i, visibleMessages),
          isPrimaryHighlighted,
          shouldScrollIntoView,
        });
      });

    return dom.div(
      {
        className: "webconsole-output",
        role: "main",
        ref: node => {
          this.outputNode = node;
        },
      },
      messageNodes
    );
  }
}

function scrollToBottom(node) {
  if (node.scrollHeight > node.clientHeight) {
    node.scrollTop = node.scrollHeight;
  }
}

function mapStateToProps(state) {
  return {
    pausedExecutionPoint: selectors.getExecutionPoint(state),
    closestMessage: selectors.getClosestMessage(state),
    messages: selectors.getAllMessagesById(state),
    visibleMessages: selectors.getVisibleMessages(state),
    messagesUi: selectors.getAllMessagesUiById(state),
    messagesPayload: selectors.getAllMessagesPayloadById(state),
    timestampsVisible: state.consoleUI.timestampsVisible,
    playback: selectors.getPlayback(state),
    hoveredItem: selectors.getHoveredItem(state),
    loadedRegions: selectors.getLoadedRegions(state),
  };
}
const mapDispatchToProps = dispatch => ({
  openLink: actions.openLink,
  dispatch,
});

module.exports = connect(mapStateToProps, mapDispatchToProps)(ConsoleOutput);
