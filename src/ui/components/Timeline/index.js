/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// React component which renders the devtools timeline and manages which
// graphics are currently being rendered.

import { connect } from "react-redux";
import { Component } from "react";
import React from "react";
import dom from "react-dom-factories";
import { log } from "protocol/socket";

import ScrollContainer from "./ScrollContainer";
import Comments from "../Comments";

const { mostRecentPaintOrMouseEvent } = require("protocol/graphics");

import { actions } from "../../actions";
import { selectors } from "../../reducers";
import Message, { MessagePreview } from "./Message";
import { timelineMarkerWidth } from "../../constants";

const { div } = dom;

import "./Timeline.css";

function classname(name, bools) {
  for (const key in bools) {
    if (bools[key]) {
      name += ` ${key}`;
    }
  }

  return name;
}

function ReplayButton({ onClick }) {
  return (
    <button onClick={onClick}>
      <div className="img replay-lg" style={{ transform: "scaleX(-1)" }} />
    </button>
  );
}
// When viewing a recording, we add a comment and move it around to indicate the
// point we are currently looking at. Since we don't have user accounts, make up
// a short name to identify us when other people view the recording.
//const UserComment = `User #${(Math.random() * 100) | 0}`;

export class Timeline extends Component {
  state = {
    comments: [],
    numResizes: 0,
    hoveringOverMarker: false,
  };

  async componentDidMount() {
    // Used in the test harness for starting playback recording.
    gToolbox.timeline = this;

    this.props.updateTimelineDimensions();

    this.toolbox.on("message-hover", this.onConsoleMessageHover);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.closestMessage != this.props.closestMessage) {
      this.scrollToMessage(this.props.closestMessage);
    }
  }

  get toolbox() {
    return gToolbox;
  }

  get debugger() {
    return this.toolbox.getPanel("debugger");
  }

  get threadFront() {
    return this.toolbox.threadFront;
  }

  get overlayWidth() {
    return this.props.timelineDimensions.width;
  }

  get zoomStartTime() {
    return this.props.zoomRegion.startTime;
  }

  get zoomEndTime() {
    return this.props.zoomRegion.endTime;
  }

  // Get the time for a mouse event within the recording.
  getMouseTime(e) {
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const clickLeft = e.clientX;

    const clickPosition = (clickLeft - left) / width;
    return Math.ceil(this.zoomStartTime + (this.zoomEndTime - this.zoomStartTime) * clickPosition);
  }

  // Called when hovering over a message in the console.
  onConsoleMessageHover = async (type, message) => {
    const { setTimelineState } = this.props;

    if (type == "mouseenter") {
      setTimelineState({ hoveredMessageId: message.id });
    }
    if (type == "mouseleave") {
      setTimelineState({ hoveredMessageId: null });
    }
  };

  findMessage(message) {
    const outputNode = document.getElementById("toolbox-content-console");
    return outputNode?.querySelector(`.message[data-message-id="${message.id}"]`);
  }

  scrollToMessage(message) {
    if (!message) {
      return;
    }

    const element = this.findMessage(message);

    if (!element) {
      return;
    }

    const outputNode = document.getElementById("toolbox-content-console");
    const consoleHeight = outputNode.getBoundingClientRect().height;
    const elementTop = element.getBoundingClientRect().top;
    if (elementTop < 30 || elementTop + 50 > consoleHeight) {
      element.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }

  showMessage(message) {
    this.scrollToMessage(message);
  }

  onMarkerClick = (e, message) => {
    const { selectedPanel, viewMode, seek } = this.props;

    e.preventDefault();
    e.stopPropagation();
    const { executionPoint, executionPointTime, executionPointHasFrames, pauseId } = message;
    seek(executionPoint, executionPointTime, executionPointHasFrames, pauseId);

    if (viewMode == "dev" && selectedPanel == "console") {
      this.showMessage(message);
    }
  };

  onMarkerMouseEnter = () => {
    this.setState({ hoveringOverMarker: true });
  };

  onMarkerMouseLeave = () => {
    this.setState({ hoveringOverMarker: false });
  };

  hoverTimer = () => {
    const { hideTooltip } = this.props;
    const isHovered = window.elementIsHovered(this.$progressBar);
    if (!isHovered) {
      clearInterval(this.hoverInterval);
      this.hoverInterval = null;
      hideTooltip();
    }
  };

  onPlayerMouseEnter = async e => {
    if (!this.hoverInterval) {
      this.hoverInterval = setInterval(this.hoverTimer, 100);
    }
  };

  onPlayerMouseMove = async e => {
    const { hoverTime, recordingDuration, setTimelineToTime, timelineDimensions } = this.props;
    if (!recordingDuration) {
      return;
    }

    const mouseTime = this.getMouseTime(e);

    if (hoverTime != mouseTime) {
      const { width, left } = timelineDimensions;
      let horizontalPadding = 12;
      let tooltipWidth = 180;
      let offset = this.getPixelOffset(mouseTime) + left - tooltipWidth / 2;

      offset = offset < horizontalPadding ? horizontalPadding : offset;
      offset =
        offset > width - tooltipWidth / 2 - horizontalPadding
          ? width - tooltipWidth / 2 - horizontalPadding
          : offset;

      setTimelineToTime({ time: mouseTime, offset });
    }
  };

  onPlayerMouseUp = e => {
    const { hoverTime, seek } = this.props;
    const { hoveringOverMarker } = this.state;
    const mouseTime = this.getMouseTime(e);

    if (hoverTime != null && !hoveringOverMarker) {
      const event = mostRecentPaintOrMouseEvent(mouseTime);
      if (event && event.point) {
        seek(event.point, mouseTime, false);
      }
    }
  };

  renderCommands() {
    const {
      playback,
      recordingDuration,
      currentTime,
      startPlayback,
      stopPlayback,
      replayPlayback,
    } = this.props;

    if (currentTime == recordingDuration) {
      return (
        <div className="commands">
          <ReplayButton onClick={replayPlayback} />
        </div>
      );
    }

    return (
      <div className="commands">
        <button onClick={() => (playback ? stopPlayback() : startPlayback())}>
          {playback ? (
            <div className="img pause-circle-lg" />
          ) : (
            <div className="img play-circle-lg" />
          )}
        </button>
      </div>
    );
  }

  // calculate pixel distance from two times
  getPixelDistance(to, from) {
    const toPos = this.getVisiblePosition(to);
    const fromPos = this.getVisiblePosition(from);

    return Math.abs((toPos - fromPos) * this.overlayWidth);
  }

  // Get the position of a time on the visible part of the timeline,
  // in the range [0, 1].
  getVisiblePosition(time) {
    if (!time) {
      return 0;
    }

    if (time <= this.zoomStartTime) {
      return 0;
    }

    if (time >= this.zoomEndTime) {
      return 1;
    }

    return (time - this.zoomStartTime) / (this.zoomEndTime - this.zoomStartTime);
  }

  // Get the pixel offset for a time.
  getPixelOffset(time) {
    return this.getVisiblePosition(time) * this.overlayWidth;
  }

  // Get the percent value for the left offset of a message.
  getLeftOffset(message) {
    const messagePosition = this.getVisiblePosition(message.executionPointTime) * 100;
    const messageWidth = (timelineMarkerWidth / this.overlayWidth) * 100;

    return Math.max(messagePosition - messageWidth / 2, 0);
  }

  renderMessages() {
    const { messages, currentTime, hoveredMessageId, zoomRegion } = this.props;

    return messages.map((message, index) => {
      const messageEl = (
        <Message
          message={message}
          index={index}
          messages={messages}
          currentTime={currentTime}
          hoveredMessageId={hoveredMessageId}
          zoomRegion={zoomRegion}
          overlayWidth={this.overlayWidth}
          onMarkerClick={this.onMarkerClick}
          onMarkerMouseEnter={this.onMarkerMouseEnter}
          onMarkerMouseLeave={this.onMarkerMouseLeave}
        />
      );

      return messageEl;
    });
  }

  renderPreviewMessages() {
    const {
      pointsForHoveredLineNumber,
      currentTime,
      highlightedMessageId,
      zoomRegion,
    } = this.props;

    if (!pointsForHoveredLineNumber) {
      return [];
    }

    return pointsForHoveredLineNumber.map((message, index) => {
      const messageEl = (
        <MessagePreview
          message={message}
          index={index}
          currentTime={currentTime}
          highlightedMessageId={highlightedMessageId}
          zoomRegion={zoomRegion}
          overlayWidth={this.overlayWidth}
        />
      );
      return messageEl;
    });
  }

  getNearbyComments(comment) {
    const pos = this.getVisiblePosition(comment.time);
    return this.state.comments.filter(c => {
      const npos = this.getVisiblePosition(c.time);
      return Math.abs(npos - pos) < 0.01;
    });
  }

  renderCommentMarker(comment) {
    if (comment.time < this.zoomStartTime || comment.time > this.zoomEndTime) {
      return;
    }

    const middlePercent = this.getVisiblePosition(comment.time) * 100;
    const widthPercent = (timelineMarkerWidth / this.overlayWidth) * 100;
    const percent = Math.max(middlePercent - widthPercent / 2, 0);

    return dom.a({
      className: classname("comment-marker"),
      style: {
        left: `${percent}%`,
        zIndex: 100000, // Render comments in front of other markers
      },
      title: "Show comment",
      onClick: e => {
        // We don't have a way to separately click on comments that are at
        // the same location on the timeline, so open up all comments that
        // are sufficiently close.
        this.setCommentsVisible(this.getNearbyComments(comment), true);
      },
      onMouseEnter: () => this.onMarkerMouseEnter(),
      onMouseLeave: () => this.onMarkerMouseLeave(),
    });
  }

  renderCommentMarkers() {
    const comments = this.state.comments;
    return comments.map(comment => this.renderCommentMarker(comment));
  }

  render() {
    const { loaded, currentTime, hoverTime, hoveredLineNumberLocation } = this.props;
    const percent = this.getVisiblePosition(currentTime) * 100;
    const hoverPercent = this.getVisiblePosition(hoverTime) * 100;

    return div(
      {
        className: classname("timeline", { dimmed: !!hoveredLineNumberLocation }),
      },
      this.renderCommands(),
      div(
        {
          className: classname("progress-bar-container", { paused: true }),
        },
        div(
          {
            className: classname("progress-bar", { loaded }),
            ["data-progress"]: Math.ceil(percent),
            ref: a => (this.$progressBar = a),
            onMouseEnter: this.onPlayerMouseEnter,
            onMouseMove: this.onPlayerMouseMove,
            onMouseUp: this.onPlayerMouseUp,
          },
          div({
            className: "progress-line full",
          }),
          div({
            className: "progress-line preview",
            style: { width: `${hoverPercent}%` },
          }),
          div({
            className: "progress-line",
            style: { width: `${percent}%` },
          }),
          div({ className: "message-container" }, ...this.renderMessages()),
          div({ className: "preview-message-container" }, ...this.renderPreviewMessages()),
          <ScrollContainer />
        ),
        <Comments />
      )
    );
  }
}

export default connect(
  state => ({
    zoomRegion: selectors.getZoomRegion(state),
    currentTime: selectors.getCurrentTime(state),
    hoverTime: selectors.getHoverTime(state),
    playback: selectors.getPlayback(state),
    hoveredMessageId: selectors.getHoveredMessageId(state),
    unprocessedRegions: selectors.getUnprocessedRegions(state),
    recordingDuration: selectors.getRecordingDuration(state),
    timelineDimensions: selectors.getTimelineDimensions(state),
    loaded: selectors.getTimelineLoaded(state),
    messages: selectors.getMessagesForTimeline(state),
    viewMode: selectors.getViewMode(state),
    selectedPanel: selectors.getSelectedPanel(state),
    hoveredLineNumberLocation: selectors.getHoveredLineNumberLocation(state),
    pointsForHoveredLineNumber: selectors.getPointsForHoveredLineNumber(state),
  }),
  {
    setTimelineToTime: actions.setTimelineToTime,
    hideTooltip: actions.hideTooltip,
    setTimelineState: actions.setTimelineState,
    updateTimelineDimensions: actions.updateTimelineDimensions,
    seek: actions.seek,
    seekToTime: actions.seekToTime,
    startPlayback: actions.startPlayback,
    stopPlayback: actions.stopPlayback,
    replayPlayback: actions.replayPlayback,
  }
)(Timeline);
