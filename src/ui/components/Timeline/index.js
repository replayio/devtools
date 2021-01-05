/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// React component which renders the devtools timeline and manages which
// graphics are currently being rendered.

import { connect } from "react-redux";
import { Component } from "react";
import React from "react";
import classnames from "classnames";

import ScrollContainer from "./ScrollContainer";
import Comments from "../Comments";

const { mostRecentPaintOrMouseEvent } = require("protocol/graphics");

import { actions } from "../../actions";
import { selectors } from "../../reducers";
import Message, { MessagePreview } from "./Message";
import { getVisiblePosition } from "ui/utils/timeline";

import "./Timeline.css";

function ReplayButton({ onClick }) {
  return (
    <button onClick={onClick}>
      <div className="img replay-lg" style={{ transform: "scaleX(-1)" }} />
    </button>
  );
}

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

  onMarkerClick = (e, message) => {
    const { selectedPanel, viewMode, seek } = this.props;

    e.preventDefault();
    e.stopPropagation();
    const { executionPoint, executionPointTime, executionPointHasFrames, pauseId } = message;
    seek(executionPoint, executionPointTime, executionPointHasFrames, pauseId);
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
    const { zoomRegion, hoverTime, setTimelineToTime, timelineDimensions } = this.props;

    const mouseTime = this.getMouseTime(e);

    if (hoverTime != mouseTime) {
      const { width, left } = timelineDimensions;
      let horizontalPadding = 12;
      let tooltipWidth = 180;
      let pixelOffset =
        getVisiblePosition({ time: mouseTime, zoom: zoomRegion }) * this.overlayWidth;
      let offset = pixelOffset + left - tooltipWidth / 2;

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

  renderMessages() {
    const { messages, currentTime, hoveredMessage, zoomRegion } = this.props;

    return (
      <div className="message-container">
        {messages.map((message, index) => (
          <Message
            message={message}
            index={index}
            key={index}
            messages={messages}
            currentTime={currentTime}
            hoveredMessage={hoveredMessage}
            zoomRegion={zoomRegion}
            overlayWidth={this.overlayWidth}
            onMarkerClick={this.onMarkerClick}
            onMarkerMouseEnter={this.onMarkerMouseEnter}
            onMarkerMouseLeave={this.onMarkerMouseLeave}
          />
        ))}
      </div>
    );
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

    return (
      <div className="preview-message-container">
        {pointsForHoveredLineNumber.map((message, index) => (
          <MessagePreview
            message={message}
            index={index}
            key={index}
            currentTime={currentTime}
            highlightedMessageId={highlightedMessageId}
            zoomRegion={zoomRegion}
            overlayWidth={this.overlayWidth}
          />
        ))}
      </div>
    );
  }

  render() {
    const {
      loaded,
      zoomRegion,
      currentTime,
      hoverTime,
      hoveredLineNumberLocation,
      hoveredMessage,
    } = this.props;
    const percent = getVisiblePosition({ time: currentTime, zoom: zoomRegion }) * 100;
    const hoverPercent = getVisiblePosition({ time: hoverTime, zoom: zoomRegion }) * 100;
    const shouldDim = hoveredLineNumberLocation || hoveredMessage;

    return (
      <div className={classnames("timeline", { dimmed: shouldDim })}>
        {this.renderCommands()}
        <div className={classnames("progress-bar-container", { paused: true })}>
          <div
            className="progress-bar"
            ref={node => (this.$progressBar = node)}
            onMouseEnter={this.onPlayerMouseEnter}
            onMouseMove={this.onPlayerMouseMove}
            onMouseUp={this.onPlayerMouseUp}
          >
            <div className="progress-line full" />
            <div className="progress-line preview" style={{ width: `${hoverPercent}%` }} />
            <div className="progress-line" style={{ width: `${percent}%` }} />
            {this.renderMessages()}
            {this.renderPreviewMessages()}
            <ScrollContainer />
          </div>
          <Comments />
        </div>
      </div>
    );
  }
}

export default connect(
  state => ({
    zoomRegion: selectors.getZoomRegion(state),
    currentTime: selectors.getCurrentTime(state),
    hoverTime: selectors.getHoverTime(state),
    playback: selectors.getPlayback(state),
    hoveredMessage: selectors.getHoveredMessage(state),
    recordingDuration: selectors.getRecordingDuration(state),
    timelineDimensions: selectors.getTimelineDimensions(state),
    messages: selectors.getMessagesForTimeline(state),
    viewMode: selectors.getViewMode(state),
    selectedPanel: selectors.getSelectedPanel(state),
    hoveredLineNumberLocation: selectors.getHoveredLineNumberLocation(state),
    pointsForHoveredLineNumber: selectors.getPointsForHoveredLineNumber(state),
    hoveredMessage: selectors.getHoveredMessage(state),
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
