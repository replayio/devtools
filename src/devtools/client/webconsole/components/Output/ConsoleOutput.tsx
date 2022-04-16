/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

import React from "react";
import { Dispatch } from "@reduxjs/toolkit";
import { connect, ConnectedProps } from "react-redux";

import { actions } from "ui/actions";
import { isVisible } from "ui/utils/dom";
import { selectors } from "ui/reducers";
import type { UIState } from "ui/state";

import { MessageContainer } from "devtools/client/webconsole/components/Output/MessageContainer";
import ConsoleLoadingBar from "./ConsoleLoadingBar";

import constants from "devtools/client/webconsole/constants";
import { StateContext } from "../Search";
import { Message } from "../../reducers/messages";

function mapStateToProps(state: UIState) {
  return {
    // @ts-ignore
    pausedExecutionPoint: selectors.getExecutionPoint(state),
    closestMessage: selectors.getClosestMessage(state),
    messages: selectors.getAllMessagesById(state),
    visibleMessages: selectors.getVisibleMessages(state),
    messagesUi: selectors.getAllMessagesUiById(state),
    timestampsVisible: state.consoleUI.timestampsVisible,
    playback: selectors.getPlayback(state),
    hoveredItem: selectors.getHoveredItem(state),
    loadedRegions: selectors.getLoadedRegions(state),
    lastMessageId: selectors.getLastMessageId(state),
    messagesCount: selectors.getTotalMessagesCount(state),
  };
}
const mapDispatchToProps = (dispatch: Dispatch) => ({
  openLink: actions.openLink,
  dispatch,
});

const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

class ConsoleOutput extends React.Component<PropsFromRedux> {
  outputNode = React.createRef<HTMLDivElement>();

  _scrollTimeoutID: number | null = null;
  _prevSearchResultMessage: Message | null = null;

  static contextType = StateContext;

  componentDidMount() {
    if (this.props.visibleMessages.length > 0) {
      scrollToBottom(this.outputNode.current!);
    }
    this.scrollCurrentSearchResultIntoView();
  }

  componentDidUpdate(prevProps: PropsFromRedux) {
    if (
      this.props.pausedExecutionPoint != prevProps.pausedExecutionPoint &&
      this.props.closestMessage != prevProps.closestMessage
    ) {
      return this.scrollToClosestMessage();
    }

    this.maybeScrollToResult(prevProps);
    this.scrollCurrentSearchResultIntoView();
  }

  ensureMessageIsInView(message: Message) {
    const element: HTMLElement = this.outputNode.current!.querySelector(
      `.message[data-message-id="${message.id}"]`
    )!;

    if (!element) {
      return;
    }

    // Don't scroll to the message if it's already in view.
    if (isVisible(this.outputNode.current!, element)) {
      return;
    }

    if (this._scrollTimeoutID) {
      clearTimeout(this._scrollTimeoutID);
    }

    // Chrome sometimes ignores element.scrollIntoView() here,
    // calling it with a little delay fixes it
    this._scrollTimeoutID = setTimeout(() =>
      element.scrollIntoView({ block: "center", behavior: "smooth" })
    );
  }

  scrollCurrentSearchResultIntoView() {
    const { currentIndex, results, visible } = this.context;

    if (!visible) {
      return;
    }

    const message =
      currentIndex >= 0 && currentIndex < results.length ? results[currentIndex] : null;

    // Only programmatically scroll after changes to the selected search result.
    if (this._prevSearchResultMessage === message || message === null) {
      return;
    }

    this._prevSearchResultMessage = message;

    this.ensureMessageIsInView(message);
  }

  scrollToClosestMessage() {
    const { closestMessage } = this.props;

    if (closestMessage) {
      this.ensureMessageIsInView(closestMessage);
    }
  }

  maybeScrollToResult(prevProps: PropsFromRedux) {
    const messagesDelta = this.props.messagesCount - prevProps.messagesCount;

    const { entities, ids } = this.props.messages;
    if (ids.length === 0) {
      return;
    }

    // We're not sorting the IDs array, so should be latest added
    const lastMessageId = ids[ids.length - 1];
    const lastMessage = entities[lastMessageId]!;

    if (messagesDelta <= 0 || lastMessage.type !== constants.MESSAGE_TYPE.RESULT) {
      return;
    }

    const node = this.outputNode.current!;
    const resultNode: HTMLElement = node.querySelector(`div[data-message-id='${lastMessage.id}']`)!;

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
    // @ts-ignore
    (previous || resultNode).scrollIntoView();
  }

  getIsFirstMessageForPoint(index: number, visibleMessages: PropsFromRedux["visibleMessages"]) {
    const { messages } = this.props;

    if (index == 0) {
      return true;
    }

    let previousMessage = messages.entities[visibleMessages[index - 1]];
    let currentMessage = messages.entities[visibleMessages[index]];

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
      timestampsVisible,
      pausedExecutionPoint,
      closestMessage,
      hoveredItem,
      loadedRegions,
    } = this.props;

    const messageNodes = visibleMessages.map((messageId, i) => {
      const message = messages.entities[messageId]!;
      // @ts-ignore ExecutionPoint/string mismatch
      const isPrimaryHighlighted = hoveredItem?.point === message.executionPoint;
      const shouldScrollIntoView = isPrimaryHighlighted && hoveredItem?.target !== "console";

      return React.createElement(MessageContainer, {
        dispatch,
        key: messageId,
        messageId,
        message,
        open: messagesUi.includes(messageId),
        // TODO Reconsider this when we rebuild message grouping
        payload: undefined,
        timestampsVisible,

        pausedExecutionPoint,
        isPaused: closestMessage?.id == messageId,
        isFirstMessageForPoint: this.getIsFirstMessageForPoint(i, visibleMessages),
        isPrimaryHighlighted,
        shouldScrollIntoView,
      });
    });

    return (
      <div className="webconsole-output" ref={this.outputNode} role="main">
        <ConsoleLoadingBar />
        {messageNodes}
      </div>
    );
  }
}

function scrollToBottom(node: HTMLElement) {
  if (node.scrollHeight > node.clientHeight) {
    node.scrollTop = node.scrollHeight;
  }
}

export default connector(ConsoleOutput);
