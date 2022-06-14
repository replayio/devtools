/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Dispatch } from "@reduxjs/toolkit";
import { SourceLocation } from "devtools/client/debugger/src/reducers/types";
import { MessageContainer } from "devtools/client/webconsole/components/Output/MessageContainer";
import { StateContext } from "devtools/client/webconsole/components/Search";
import constants from "devtools/client/webconsole/constants";
import { Frame, Message } from "devtools/client/webconsole/reducers/messages";
import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import {
  enterFocusMode,
  setFocusRegionEndTime,
  setFocusRegionBeginTime,
} from "ui/actions/timeline";
import { ContextMenu } from "ui/components/ContextMenu";
import { Dropdown, DropdownItem } from "ui/components/Library/LibraryDropdown";
import Icon from "ui/components/shared/Icon";
import { selectors } from "ui/reducers";
import {
  getCurrentTime,
  getFocusRegion,
  getShowFocusModeControls,
  getZoomRegion,
} from "ui/reducers/timeline";
import type { AppDispatch } from "ui/setup/store";
import type { UIState } from "ui/state";
import { isVisible } from "ui/utils/dom";
import { convertPointToTime } from "ui/utils/time";
import { displayedEndForFocusRegion, displayedBeginForFocusRegion } from "ui/utils/timeline";

import ConsoleLoadingBar from "./ConsoleLoadingBar";
import styles from "./ConsoleOutput.module.css";

import type { State as ConsoleSearchState } from "../Search/useConsoleSearch";

function compareLocation(locA: Frame | undefined, locB: SourceLocation) {
  if (!locA) {
    return false;
  }
  return locA.sourceId == locB.sourceId && locA.line == locB.line && locA.column == locB.column;
}

type PropsFromRedux = ConnectedProps<typeof connector>;

interface State {
  contextMenu: {
    message: Message;
    pageX: number;
    pageY: number;
  } | null;
}

class ConsoleOutput extends React.Component<PropsFromRedux, State> {
  outputNode = React.createRef<HTMLDivElement>();

  _scrollTimeoutID: number | null = null;
  _prevSearchResultMessage: Message | null = null;

  static contextType = StateContext;

  state: State = {
    contextMenu: null,
  };

  componentDidMount() {
    if (this.props.visibleMessageIDs.length > 0) {
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
    const { index, results, visible } = this.context as ConsoleSearchState;

    if (!visible) {
      return;
    }

    const message = index >= 0 && index < results.length ? results[index] : null;

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

  getIsFirstMessageForPoint(index: number, visibleMessageIDs: PropsFromRedux["visibleMessageIDs"]) {
    const { messages } = this.props;

    if (index == 0) {
      return true;
    }

    let previousMessage = messages.entities[visibleMessageIDs[index - 1]];
    let currentMessage = messages.entities[visibleMessageIDs[index]];

    if (!previousMessage || !currentMessage) {
      return false;
    }

    return previousMessage.executionPoint !== currentMessage.executionPoint;
  }

  render() {
    const {
      breakpoints,
      closestMessage,
      currentTime,
      dispatch,
      hoveredItem,
      messages,
      messagesUi,
      pausedExecutionPoint,
      timestampsVisible,
      visibleMessageIDs,
    } = this.props;
    const { contextMenu } = this.state;

    const messageNodes = visibleMessageIDs.map((messageId, i) => {
      const message = messages.entities[messageId]!;
      // @ts-ignore ExecutionPoint/string mismatch
      const isPrimaryHighlighted = hoveredItem?.point === message.executionPoint;
      const shouldScrollIntoView = isPrimaryHighlighted && hoveredItem?.target !== "console";

      const matchingBreakpoint = breakpoints.find(bp =>
        compareLocation(message.frame, bp.location)
      );

      const prefixBadge = matchingBreakpoint?.options.prefixBadge;

      return React.createElement(MessageContainer, {
        currentTime,
        // TODO Reconsider this when we rebuild message grouping
        dispatch,
        isFirstMessageForPoint: this.getIsFirstMessageForPoint(i, visibleMessageIDs),
        isPaused: closestMessage?.id == messageId,
        isPrimaryHighlighted,
        key: messageId,
        message,
        messageId,
        open: messagesUi.includes(messageId),
        pausedExecutionPoint,
        payload: undefined,
        prefixBadge,
        shouldScrollIntoView,
        timestampsVisible,
      });
    });

    return (
      <>
        <div
          className="webconsole-output"
          ref={this.outputNode}
          role="main"
          onContextMenu={this.onContextMenu}
        >
          <ConsoleLoadingBar />
          <TrimmedMessageCountRow position="before" />
          {messageNodes}
          <TrimmedMessageCountRow position="after" />
        </div>
        {contextMenu !== null && (
          <ContextMenu x={contextMenu.pageX} y={contextMenu.pageY} close={this.closeContextMenu}>
            <Dropdown>
              <DropdownItem onClick={this.setFocusStart}>
                <>
                  <Icon filename="set-focus-start" className="mr-4 bg-iconColor" size="large" />
                  Set focus start
                </>
              </DropdownItem>
              <DropdownItem onClick={this.setFocusEnd}>
                <>
                  <Icon filename="set-focus-end" className="mr-4 bg-iconColor" size="large" />
                  Set focus end
                </>
              </DropdownItem>
            </Dropdown>
          </ContextMenu>
        )}
      </>
    );
  }

  closeContextMenu = () => {
    this.setState({ contextMenu: null });
  };

  onContextMenu = (event: React.MouseEvent) => {
    // This method of mapping context-menu event to a message is a bit hacky.
    // This section of the UI was written in a pretty imperative style though.
    // Ideally we will revisit and refactor the console UI components at some point.
    let message: Message | null = null;
    let target: HTMLElement | null = event.target as HTMLElement;
    while (target) {
      if (target.hasAttribute("data-message-id")) {
        const id = parseInt(target.getAttribute("data-message-id") as string);
        message = this.props.messages.entities[id] || null;
        break;
      }

      target = target.parentElement;
    }

    if (message == null) {
      return;
    }

    event.stopPropagation();
    event.preventDefault();

    this.setState({
      contextMenu: {
        message,
        pageX: event.pageX,
        pageY: event.pageY,
      },
    });
  };

  setFocusEnd = async () => {
    const { dispatch, focusRegion } = this.props;
    const { message } = this.state.contextMenu!;

    this.setState({ contextMenu: null });

    const time = await getTimeForMessage(message);
    if (time < 0) {
      console.error("Could not calculate time for message", message);
      return;
    }

    (dispatch as AppDispatch)(setFocusRegionEndTime(time, true));
  };

  setFocusStart = async () => {
    const { dispatch } = this.props;
    const { message } = this.state.contextMenu!;

    this.setState({ contextMenu: null });

    const time = await getTimeForMessage(message);
    if (time < 0) {
      console.error("Could not calculate time for message", message);
      return;
    }

    (dispatch as AppDispatch)(setFocusRegionBeginTime(time, true));
  };
}

function scrollToBottom(node: HTMLElement) {
  if (node.scrollHeight > node.clientHeight) {
    node.scrollTop = node.scrollHeight;
  }
}

function mapStateToProps(state: UIState) {
  return {
    // @ts-ignore
    breakpoints: selectors.getBreakpointsList(state),
    closestMessage: selectors.getClosestMessage(state),
    currentTime: getCurrentTime(state),
    focusRegion: getFocusRegion(state),
    hoveredItem: selectors.getHoveredItem(state),
    lastMessageId: selectors.getLastMessageId(state),
    messages: selectors.getAllMessagesById(state),
    messagesCount: selectors.getTotalMessagesCount(state),
    messagesUi: selectors.getAllMessagesUiById(state),
    pausedExecutionPoint: selectors.getExecutionPoint(state),
    playback: selectors.getPlayback(state),
    timestampsVisible: state.consoleUI.timestampsVisible,
    visibleMessageIDs: selectors.getVisibleMessageData(state).messageIDs,
  };
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  dispatch,
});

const connector = connect(mapStateToProps, mapDispatchToProps);

export default connector(ConsoleOutput);

async function getTimeForMessage(message: Message): Promise<number> {
  const { executionPoint, executionPointTime, timeStamp } = message;
  if (timeStamp != null) {
    return timeStamp;
  } else if (executionPointTime != null) {
    return executionPointTime;
  } else if (executionPoint != null) {
    return await convertPointToTime(executionPoint);
  }

  return -1;
}

function TrimmedMessageCountRow({ position }: { position: "before" | "after" }) {
  const dispatch = useAppDispatch();
  const focusRegion = useAppSelector(getFocusRegion);
  const zoomRegion = useAppSelector(getZoomRegion);
  const showFocusModeControls = useAppSelector(getShowFocusModeControls);
  const { countAfter, countBefore, isFilteredCountExact, messageIDs } = useAppSelector(
    selectors.getVisibleMessageData
  );

  // If the user has no focus region, there's nothing for this component to show.
  if (focusRegion === null) {
    return null;
  }

  // If there are no visible messages after filtering, show a single row for both before and after counts.
  let count = position === "before" ? countBefore : countAfter;
  let label: string = position;
  if (messageIDs.length === 0) {
    if (position === "before") {
      count = countBefore + countAfter;
      label = "outside of";
    } else {
      return null;
    }
  } else {
    // Edge case handling here:
    // Don't show a nonsensical message about filtered logs before or after the focus window
    // if the focus window is at the very start or end of the recording.
    if (position === "before") {
      if (displayedBeginForFocusRegion(focusRegion) === 0) {
        return null;
      }
    } else {
      if (displayedEndForFocusRegion(focusRegion) === zoomRegion.endTime) {
        return null;
      }
    }
  }

  const showFocusEditor = () => {
    if (!showFocusModeControls) {
      dispatch(enterFocusMode());
    }
  };

  if (count === 0) {
    if (isFilteredCountExact) {
      // If we're confident there are no filtered messages, there's nothing for this component to show.
      return null;
    } else {
      // Even though no messages were filtered out on the client, there may be messages outside of the focus region on the server.
      // The best we can do in this case is say "maybe".
      return (
        <div className={styles.TrimmedMessageCountRow}>
          There may be some logs {label}{" "}
          <span className={styles.TrimmedMessageLink} onClick={showFocusEditor}>
            your debugging window
          </span>
          .
        </div>
      );
    }
  } else {
    let description;
    if (count === 1) {
      description = `There is ${isFilteredCountExact ? "" : "at least"} ${count} log ${label}`;
    } else {
      description = `There are ${isFilteredCountExact ? "" : "at least"} ${count} logs ${label}`;
    }

    return (
      <div className={styles.TrimmedMessageCountRow}>
        {description}{" "}
        <span className={styles.TrimmedMessageLink} onClick={showFocusEditor}>
          your debugging window
        </span>
        .
      </div>
    );
  }
}
