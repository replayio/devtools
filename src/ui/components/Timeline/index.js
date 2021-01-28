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
import AddCommentButton from "./AddCommentButton";

const { mostRecentPaintOrMouseEvent, paintGraphicsAtTime } = require("protocol/graphics");

import { actions } from "../../actions";
import { selectors } from "../../reducers";
import Marker from "./Marker";
import MessageMarker from "./MessageMarker";
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

  get overlayWidth() {
    return this.props.timelineDimensions.width;
  }

  // Get the time for a mouse event within the recording.
  getMouseTime(e) {
    const { startTime, endTime } = this.props.zoomRegion;
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const clickLeft = e.clientX;

    const clickPosition = (clickLeft - left) / width;
    return Math.ceil(startTime + (endTime - startTime) * clickPosition);
  }

  hoverTimer = () => {
    const { hideTooltip, currentTime } = this.props;
    const isHovered = window.elementIsHovered(this.$progressBar);
    if (!isHovered) {
      clearInterval(this.hoverInterval);
      paintGraphicsAtTime(currentTime);
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

      paintGraphicsAtTime(mouseTime);
      setTimelineToTime({ time: mouseTime, offset });
    }
  };

  onPlayerMouseUp = e => {
    const { hoverTime, seek, hoveredPoint } = this.props;
    const hoveringOverMarker = hoveredPoint?.target === "timeline";
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
    const { messages, currentTime, hoveredPoint, zoomRegion } = this.props;

    return (
      <div className="markers-container">
        {messages.map((message, index) => (
          <MessageMarker
            message={message}
            key={index}
            currentTime={currentTime}
            hoveredPoint={hoveredPoint}
            zoomRegion={zoomRegion}
            overlayWidth={this.overlayWidth}
          />
        ))}
      </div>
    );
  }

  renderEvents() {
    const { clickEvents, currentTime, hoveredPoint, zoomRegion } = this.props;

    return (
      <div className="markers-container">
        {clickEvents.map((point, index) => (
          <Marker
            key={index}
            point={point.point}
            time={point.time}
            hasFrames={"false"}
            currentTime={currentTime}
            hoveredPoint={hoveredPoint}
            zoomRegion={zoomRegion}
            overlayWidth={this.overlayWidth}
          />
        ))}
      </div>
    );
  }

  renderPreviewMarkers() {
    const { pointsForHoveredLineNumber, currentTime, hoveredPoint, zoomRegion } = this.props;

    if (!pointsForHoveredLineNumber) {
      return [];
    }

    return (
      <div className="preview-markers-container">
        {pointsForHoveredLineNumber.map((point, index) => (
          <Marker
            key={index}
            point={point.point}
            time={point.time}
            hasFrames={point.hasFrames}
            location={point.frame[0]}
            currentTime={currentTime}
            hoveredPoint={hoveredPoint}
            zoomRegion={zoomRegion}
            overlayWidth={this.overlayWidth}
          />
        ))}
      </div>
    );
  }

  render() {
    const {
      zoomRegion,
      currentTime,
      hoverTime,
      hoveredLineNumberLocation,
      hoveredPoint,
      viewMode,
    } = this.props;
    const percent = getVisiblePosition({ time: currentTime, zoom: zoomRegion }) * 100;
    const hoverPercent = getVisiblePosition({ time: hoverTime, zoom: zoomRegion }) * 100;
    const shouldDim = hoveredLineNumberLocation || hoveredPoint;

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
            {viewMode == "dev" ? this.renderMessages() : this.renderEvents()}
            {this.renderPreviewMarkers()}
            <ScrollContainer />
          </div>
          <Comments />
        </div>
        <AddCommentButton />
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
    recordingDuration: selectors.getRecordingDuration(state),
    timelineDimensions: selectors.getTimelineDimensions(state),
    messages: selectors.getMessagesForTimeline(state),
    viewMode: selectors.getViewMode(state),
    selectedPanel: selectors.getSelectedPanel(state),
    hoveredLineNumberLocation: selectors.getHoveredLineNumberLocation(state),
    pointsForHoveredLineNumber: selectors.getPointsForHoveredLineNumber(state),
    hoveredPoint: selectors.getHoveredPoint(state),
    clickEvents: selectors.getEventsForType(state, "mousedown"),
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
