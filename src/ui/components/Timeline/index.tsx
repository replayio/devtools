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

import Tooltip from "./Tooltip";
import Comments from "../Comments";

import { ThreadFront } from "protocol/thread";
import { mostRecentPaintOrMouseEvent } from "protocol/graphics";

import { actions } from "ui/actions";
import { selectors } from "ui/reducers";
import Marker from "./Marker";
import MessageMarker from "./MessageMarker";
import EventMarker from "./EventMarker";

import { getVisiblePosition, getFormattedTime } from "ui/utils/timeline";
import { getLocationKey } from "devtools/client/debugger/src/utils/breakpoint";

import { UIState } from "ui/state";
import { HoveredItem } from "ui/state/timeline";
import { prefs, features } from "ui/utils/prefs";
import { Focuser } from "./Focuser";
import { trackEvent } from "ui/utils/telemetry";
import IndexingLoader from "../shared/IndexingLoader";
import { EditFocusButton } from "./EditFocusButton";

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
    const { setTimelineToTime } = this.props;
    if (!this.$progressBar) {
      return;
    }
    const isHovered = window.elementIsHovered(this.$progressBar);
    if (!isHovered) {
      window.clearInterval(this.hoverInterval);
      this.hoverInterval = undefined;
      setTimelineToTime(null, false);
    }
  };

  onPlayerMouseEnter: MouseEventHandler = async e => {
    if (!this.hoverInterval) {
      this.hoverInterval = window.setInterval(this.hoverTimer, 100);
    }
  };

  onPlayerMouseMove: MouseEventHandler = e => {
    const { hoverTime, setTimelineToTime, setTimelineState, isFocusing } = this.props;
    const mouseTime = this.getMouseTime(e);
    const isDragging = e.buttons === 1;

    if (hoverTime != mouseTime) {
      setTimelineToTime(mouseTime, isDragging);
    }
    if (isDragging && !isFocusing) {
      setTimelineState({ currentTime: mouseTime });
    }
  };

  onPlayerMouseUp: MouseEventHandler = e => {
    const {
      hoverTime,
      seek,
      hoveredComment,
      clearPendingComment,
      setTimelineToTime,
      setTimelineState,
      isFocusing,
    } = this.props;
    // if the user clicked on a comment marker, we already seek to the comment's
    // execution point, so we don't want to seek a second time here
    const clickedOnCommentMarker =
      e.target instanceof Element && [...e.target.classList].includes("comment-marker");
    const mouseTime = this.getMouseTime(e);

    trackEvent("timeline.progress_select");

    if (hoverTime != null && !clickedOnCommentMarker) {
      const event = mostRecentPaintOrMouseEvent(mouseTime);
      if (event && event.point) {
        if (!seek(event.point, mouseTime, false)) {
          // if seeking to the new point failed because it is in an unloaded region,
          // we reset the timeline to the current time
          setTimelineToTime(ThreadFront.currentTime, true);
          setTimelineState({ currentTime: ThreadFront.currentTime });
        }
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
      videoUrl,
      focusRegion,
    } = this.props;
    const disabled = !videoUrl && (features.videoPlayback as boolean);
    const replay = () => {
      if (disabled) {
        return;
      }
      trackEvent("timeline.replay");
      clearPendingComment();
      replayPlayback();
    };
    const togglePlayback = () => {
      if (disabled) {
        return;
      }

      clearPendingComment();
      if (playback) {
        trackEvent("timeline.pause");
        stopPlayback();
      } else {
        trackEvent("timeline.play");
        startPlayback();
      }
    };

    if (focusRegion ? currentTime === focusRegion.endTime : currentTime == recordingDuration) {
      return (
        <div className="commands">
          <button className="relative" onClick={replay} disabled={disabled}>
            <IndexingLoader />
            <div className="flex flex-row" style={{ width: "32px", height: "32px" }}>
              <img className="m-auto h-6 w-6" src="/images/playback-refresh.svg" />
            </div>
          </button>
        </div>
      );
    }

    return (
      <div className="commands">
        <button className="relative" onClick={togglePlayback} disabled={disabled}>
          <IndexingLoader />
          {playback ? (
            <div className="flex flex-row" style={{ width: "32px", height: "32px" }}>
              <img className="m-auto h-6 w-6" src="/images/playback-pause.svg" />
            </div>
          ) : (
            <div className="flex flex-row" style={{ width: "32px", height: "32px" }}>
              <img className="m-auto h-6 w-6" src="/images/playback-play.svg" />
            </div>
          )}
        </button>
      </div>
    );
  }

  renderMessages() {
    const { messages, hoveredItem } = this.props;
    if (messages.length >= prefs.maxHitsDisplayed) {
      return null;
    }

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

    if (
      !pointsForHoveredLineNumber ||
      pointsForHoveredLineNumber === "error" ||
      pointsForHoveredLineNumber.length > prefs.maxHitsDisplayed
    ) {
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

  renderUnloadedRegions() {
    const { loadedRegions, isFinishedLoadingRegions, zoomRegion } = this.props;

    // Check loadedRegions to keep typescript happy.
    if (!loadedRegions || !isFinishedLoadingRegions) {
      return null;
    }

    // An empty loadedRegions array after we've finished loading regions means that
    // the whole recording has been unloaded.
    if (loadedRegions.length === 0) {
      return <div className="unloaded-regions w-full" />;
    }

    const { begin, end } = loadedRegions[0];
    const { endTime } = zoomRegion;
    const loadedRegionStart = getVisiblePosition({ time: begin.time, zoom: zoomRegion }) * 100;
    const loadedRegionEnd =
      getVisiblePosition({ time: endTime - end.time, zoom: zoomRegion }) * 100;

    return (
      <>
        <div
          className="unloaded-regions start"
          style={{ width: `${clamp(loadedRegionStart, 0, 100)}%` }}
        />
        <div
          className="unloaded-regions end"
          style={{ width: `${clamp(loadedRegionEnd, 0, 100)}%` }}
        />
      </>
    );
  }

  renderTrimmedRegion() {
    const { focusRegion, zoomRegion } = this.props;

    if (!focusRegion) {
      return null;
    }

    const { startTime, endTime } = focusRegion;
    const { endTime: duration } = zoomRegion;
    const start = getVisiblePosition({ time: startTime, zoom: zoomRegion }) * 100;
    const end = getVisiblePosition({ time: duration - endTime, zoom: zoomRegion }) * 100;

    return (
      <>
        <div
          className="unloaded-regions start"
          style={{
            width: `${clamp(start, 0, 100)}%`,
          }}
        />
        <div
          className="unloaded-regions end"
          style={{
            width: `${clamp(end, 0, 100)}%`,
          }}
        />
      </>
    );
  }

  render() {
    const { zoomRegion, currentTime, hoverTime, precachedTime, recordingDuration, isFocusing } =
      this.props;
    const percent = getVisiblePosition({ time: currentTime, zoom: zoomRegion }) * 100;
    const hoverPercent = getVisiblePosition({ time: hoverTime, zoom: zoomRegion }) * 100;
    const precachedPercent = getVisiblePosition({ time: precachedTime, zoom: zoomRegion }) * 100;
    const formattedTime = getFormattedTime(currentTime);
    const showCurrentPauseMarker =
      (this.isHovering() && percent >= 0 && percent <= 100) || isFocusing;

    return (
      <div className="timeline">
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
              className="progress-line preview-max"
              style={{ width: `${clamp(Math.max(hoverPercent, precachedPercent), 0, 100)}%` }}
            />
            <div
              className="progress-line preview-min"
              style={{ width: `${clamp(Math.min(hoverPercent, precachedPercent), 0, 100)}%` }}
            />
            <div className="progress-line" style={{ width: `${clamp(percent, 0, 100)}%` }} />
            {this.renderUnloadedRegions()}
            {features.focusing ? this.renderTrimmedRegion() : null}
            {showCurrentPauseMarker ? (
              <div className="progress-line-paused" style={{ left: `${percent}%` }} />
            ) : null}
            {this.renderPreviewMarkers()}
            <Comments />
            {isFocusing ? <Focuser /> : null}
          </div>
          <Tooltip timelineWidth={this.overlayWidth} />
        </div>
        <div
          className="timeline-time text-right"
          style={{ minWidth: `${formattedTime.length * 2 + 2}ch` }}
        >
          <span className="time-current">{formattedTime}</span>
          <span className="time-divider">/</span>
          <span className="time-total">{getFormattedTime(recordingDuration || 0)}</span>
        </div>
        {features.focusing ? <EditFocusButton /> : null}
      </div>
    );
  }
}

const connector = connect(
  (state: UIState) => ({
    loadedRegions: selectors.getLoadedRegions(state)?.loaded,
    isFinishedLoadingRegions: selectors.isFinishedLoadingRegions(state),
    zoomRegion: selectors.getZoomRegion(state),
    currentTime: selectors.getCurrentTime(state),
    hoverTime: selectors.getHoverTime(state),
    precachedTime: selectors.getPlaybackPrecachedTime(state),
    playback: selectors.getPlayback(state),
    recordingDuration: selectors.getRecordingDuration(state),
    timelineDimensions: selectors.getTimelineDimensions(state),
    messages: selectors.getMessagesForTimeline(state),
    viewMode: selectors.getViewMode(state),
    selectedPanel: selectors.getSelectedPanel(state),
    pointsForHoveredLineNumber: selectors.getPointsForHoveredLineNumber(state),
    hoveredItem: selectors.getHoveredItem(state),
    hoveredComment: selectors.getHoveredComment(state),
    clickEvents: selectors.getEventsForType(state, "mousedown"),
    videoUrl: selectors.getVideoUrl(state),
    isFocusing: selectors.getIsFocusing(state),
    focusRegion: selectors.getFocusRegion(state),
  }),
  {
    setTimelineToTime: actions.setTimelineToTime,
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
