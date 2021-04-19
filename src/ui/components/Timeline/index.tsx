/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// React component which renders the devtools timeline and manages which
// graphics are currently being rendered.

import { connect, ConnectedProps } from "react-redux";
import { Component, MouseEventHandler } from "react";
import type { PointDescription, Location } from "@recordreplay/protocol";
import React from "react";
import classnames from "classnames";
import clamp from "lodash/clamp";

import ScrollContainer from "./ScrollContainer";
import Tooltip from "./Tooltip";
const Comments = require("../Comments").default;

import { mostRecentPaintOrMouseEvent } from "protocol/graphics";

import { actions } from "ui/actions";
import { selectors } from "ui/reducers";
import Marker from "./Marker";
import MessageMarker from "./MessageMarker";
import EventMarker from "./EventMarker";

const { getVisiblePosition, getFormattedTime } = require("ui/utils/timeline");
import { getLocationKey } from "devtools/client/debugger/src/utils/breakpoint";

import "./Timeline.css";
import { UIState } from "ui/state";
import { HoveredItem } from "ui/state/timeline";

function ReplayButton({ onClick }: { onClick: MouseEventHandler }) {
  return (
    <button onClick={onClick}>
      <div className="img replay-lg" style={{ transform: "scaleX(-1)" }} />
    </button>
  );
}

function getIsSecondaryHighlighted(
  hoveredItem: HoveredItem | null,
  location: Location | undefined
) {
  if (hoveredItem?.target == "console" || !location || !hoveredItem?.location) {
    return false;
  }

  return getLocationKey(hoveredItem.location) == getLocationKey(location);
}

class Timeline extends Component<PropsFromRedux> {
  $progressBar: HTMLDivElement | null = null;
  hoverInterval: number | undefined;

  async componentDidMount() {
    // Used in the test harness for starting playback recording.
    gToolbox.timeline = this;

    this.props.updateTimelineDimensions();
  }

  get overlayWidth() {
    return this.props.timelineDimensions.width;
  }

  // Get the time for a mouse event within the recording.
  getMouseTime(e: React.MouseEvent) {
    const { startTime, endTime } = this.props.zoomRegion;
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const clickLeft = e.clientX;

    const clickPosition = Math.max((clickLeft - left) / width, 0);
    return Math.ceil(startTime + (endTime - startTime) * clickPosition);
  }

  hoverTimer = () => {
    if (!this.$progressBar) {
      return;
    }
    const { hideTooltip, currentTime } = this.props;
    const isHovered = window.elementIsHovered(this.$progressBar);
    if (!isHovered) {
      window.clearInterval(this.hoverInterval);
      this.hoverInterval = undefined;
      hideTooltip();
    }
  };

  onPlayerMouseEnter: MouseEventHandler = async e => {
    if (!this.hoverInterval) {
      this.hoverInterval = window.setInterval(this.hoverTimer, 100);
    }
  };

  onPlayerMouseMove: MouseEventHandler = e => {
    const { hoverTime, setTimelineToTime, setTimelineState } = this.props;
    const mouseTime = this.getMouseTime(e);
    const isDragging = e.buttons === 1;

    if (hoverTime != mouseTime) {
      setTimelineToTime(mouseTime, isDragging);
    }
    if (isDragging) {
      setTimelineState({ currentTime: mouseTime });
    }
  };

  onPlayerMouseUp: MouseEventHandler = e => {
    const { hoverTime, seek, hoveredItem, clearPendingComment } = this.props;
    const hoveringOverMarker = hoveredItem?.target === "timeline";
    const mouseTime = this.getMouseTime(e);

    if (hoverTime != null && !hoveringOverMarker) {
      const event = mostRecentPaintOrMouseEvent(mouseTime);
      if (event && event.point) {
        seek(event.point, mouseTime, false);
        clearPendingComment();
      }
    }
  };

  isHovering() {
    return !!this.hoverInterval;
  }

  renderCommands() {
    const {
      playback,
      recordingDuration,
      currentTime,
      startPlayback,
      stopPlayback,
      replayPlayback,
      clearPendingComment,
    } = this.props;
    const replay = () => {
      clearPendingComment();
      replayPlayback();
    };
    const togglePlayback = () => {
      clearPendingComment();
      if (playback) {
        stopPlayback();
      } else {
        startPlayback();
      }
    };

    if (currentTime == recordingDuration) {
      return (
        <div className="commands">
          <ReplayButton onClick={replay} />
        </div>
      );
    }

    return (
      <div className="commands">
        <button onClick={togglePlayback}>
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
    const { messages, hoveredItem } = this.props;

    return (
      <div className="markers-container">
        {messages.map((message: any, index: number) => {
          const isPrimaryHighlighted = hoveredItem?.point === message.executionPoint;
          const isSecondaryHighlighted = getIsSecondaryHighlighted(hoveredItem, message.frame);

          return (
            <MessageMarker
              key={index}
              message={message}
              isPrimaryHighlighted={isPrimaryHighlighted}
              isSecondaryHighlighted={isSecondaryHighlighted}
            />
          );
        })}
      </div>
    );
  }

  renderEvents() {
    const { clickEvents, hoveredItem } = this.props;

    return (
      <div className="markers-container">
        {clickEvents.map((event, index) => {
          const isPrimaryHighlighted = hoveredItem?.point === event.point;
          return (
            <EventMarker key={index} event={event} isPrimaryHighlighted={isPrimaryHighlighted} />
          );
        })}
      </div>
    );
  }

  renderPreviewMarkers() {
    const { pointsForHoveredLineNumber, currentTime, hoveredItem, zoomRegion } = this.props;

    if (!pointsForHoveredLineNumber) {
      return [];
    }

    return (
      <div className="preview-markers-container">
        {pointsForHoveredLineNumber.map((point: PointDescription, index: number) => {
          const isPrimaryHighlighted = hoveredItem?.point === point.point;
          const isSecondaryHighlighted = getIsSecondaryHighlighted(hoveredItem, point.frame?.[0]);

          return (
            <Marker
              key={index}
              point={point.point}
              time={point.time}
              hasFrames={!!point.frame}
              location={point.frame?.[0]}
              currentTime={currentTime}
              isPrimaryHighlighted={isPrimaryHighlighted}
              isSecondaryHighlighted={isSecondaryHighlighted}
              zoomRegion={zoomRegion}
              overlayWidth={this.overlayWidth}
            />
          );
        })}
      </div>
    );
  }

  render() {
    const {
      zoomRegion,
      currentTime,
      hoverTime,
      hoveredLineNumberLocation,
      hoveredItem,
      viewMode,
      selectedPanel,
      recordingDuration,
    } = this.props;
    const percent = getVisiblePosition({ time: currentTime, zoom: zoomRegion }) * 100;
    const hoverPercent = getVisiblePosition({ time: hoverTime, zoom: zoomRegion }) * 100;
    const shouldDim = hoveredLineNumberLocation || hoveredItem;

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
            <div
              className="progress-line preview"
              style={{ width: `${clamp(hoverPercent, 0, 100)}%` }}
            />
            <div className="progress-line" style={{ width: `${clamp(percent, 0, 100)}%` }} />
            {this.isHovering() && percent >= 0 && percent <= 100 ? (
              <div className="progress-line-paused" style={{ left: `${percent}%` }} />
            ) : null}
            {viewMode == "dev" && selectedPanel == "console"
              ? this.renderMessages()
              : this.renderEvents()}
            {this.renderPreviewMarkers()}
            <ScrollContainer />
            <Comments />
          </div>
          <Tooltip timelineWidth={this.overlayWidth} />
        </div>
        <div className="timeline-time">
          <span className="time-current">{getFormattedTime(currentTime)}</span>
          <span className="time-divider">/</span>
          <span className="time-total">{getFormattedTime(recordingDuration)}</span>
        </div>
      </div>
    );
  }
}

const connector = connect(
  (state: UIState) => ({
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
    hoveredItem: selectors.getHoveredItem(state),
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
    clearPendingComment: actions.clearPendingComment,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(Timeline);
