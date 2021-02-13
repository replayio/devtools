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

import ScrollContainer from "./ScrollContainer";
import Tooltip from "./Tooltip";
const Comments = require("../Comments").default;

import { mostRecentPaintOrMouseEvent, paintGraphicsAtTime } from "protocol/graphics";

import { actions } from "ui/actions";
import { selectors } from "ui/reducers";
import Marker from "./Marker";
import MessageMarker from "./MessageMarker";
import EventMarker from "./EventMarker";
const { getVisiblePosition } = require("ui/utils/timeline");
import { getLocationKey } from "devtools/client/debugger/src/utils/breakpoint";

import "./Timeline.css";
import { UIState } from "ui/state";
import { HoveredPoint } from "ui/state/timeline";

function ReplayButton({ onClick }: { onClick: MouseEventHandler }) {
  return (
    <button onClick={onClick}>
      <div className="img replay-lg" style={{ transform: "scaleX(-1)" }} />
    </button>
  );
}

function getIsSecondaryHighlighted(
  hoveredPoint: HoveredPoint | null,
  location: Location | undefined
) {
  if (!location || !hoveredPoint?.location) {
    return false;
  }

  return getLocationKey(hoveredPoint.location) == getLocationKey(location);
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
      paintGraphicsAtTime(currentTime);
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
    const { zoomRegion, hoverTime, setTimelineToTime } = this.props;
    const mouseTime = this.getMouseTime(e);

    if (hoverTime != mouseTime) {
      setTimelineToTime(mouseTime);
    }
  };

  onPlayerMouseUp: MouseEventHandler = e => {
    const { hoverTime, seek, hoveredPoint, clearPendingComment } = this.props;
    const hoveringOverMarker = hoveredPoint?.target === "timeline";
    const mouseTime = this.getMouseTime(e);

    if (hoverTime != null && !hoveringOverMarker) {
      const event = mostRecentPaintOrMouseEvent(mouseTime);
      if (event && event.point) {
        seek(event.point, mouseTime, false);
        clearPendingComment();
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
    const { messages, hoveredPoint } = this.props;

    return (
      <div className="markers-container">
        {messages.map((message: any, index: number) => {
          const isPrimaryHighlighted = hoveredPoint?.point === message.executionPoint;
          const isSecondaryHighlighted = getIsSecondaryHighlighted(hoveredPoint, message.frame);

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
    const { clickEvents, hoveredPoint } = this.props;

    return (
      <div className="markers-container">
        {clickEvents.map((event, index) => {
          const isPrimaryHighlighted = hoveredPoint?.point === event.point;
          return (
            <EventMarker key={index} event={event} isPrimaryHighlighted={isPrimaryHighlighted} />
          );
        })}
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
        {pointsForHoveredLineNumber.map((point: PointDescription, index: number) => {
          const isPrimaryHighlighted = hoveredPoint?.point === point.point;
          const isSecondaryHighlighted = getIsSecondaryHighlighted(hoveredPoint, point.frame?.[0]);

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
              onSeek={() => {}}
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
      hoveredPoint,
      viewMode,
      selectedPanel,
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
            {viewMode == "dev" && selectedPanel == "console"
              ? this.renderMessages()
              : this.renderEvents()}
            {this.renderPreviewMarkers()}
            <ScrollContainer />
          </div>
          <Comments />
          <Tooltip timelineWidth={this.overlayWidth} />
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
    clearPendingComment: actions.clearPendingComment,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(Timeline);
