/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// React component which renders the devtools timeline and manages which
// graphics are currently being rendered.

import { connect } from "react-redux";
import classnames from "classnames";
import { Component } from "react";
import React from "react";
import dom from "react-dom-factories";
import { log } from "protocol/socket";

import ScrollContainer from "./ScrollContainer";
import Comments from "../Comments";

const {
  mostRecentPaintOrMouseEvent,
  nextPaintOrMouseEvent,
  nextPaintEvent,
  previousPaintEvent,
  getGraphicsAtTime,
  paintGraphics,
} = require("protocol/graphics");

const { assert } = require("protocol/utils");

import { actions } from "../../actions";
import { selectors } from "../../reducers";
import Message from "./Message";
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
      <div className="img replay-lg" />
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
      setTimelineState({ highlightedMessage: message.id });
    }

    return null;
  };

  findMessage(message) {
    const outputNode = document.getElementById("toolbox-content-console");
    return outputNode.querySelector(`.message[data-message-id="${message.id}"]`);
  }

  scrollToMessage(message) {
    if (!message) {
      return;
    }

    const element = this.findMessage(message);
    const outputNode = document.getElementById("toolbox-content-console");

    if (element) {
      const consoleHeight = outputNode.getBoundingClientRect().height;
      const elementTop = element.getBoundingClientRect().top;
      if (elementTop < 30 || elementTop + 50 > consoleHeight) {
        element.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    }
  }

  unhighlightConsoleMessage() {
    if (this.props.highlightedMessageId) {
      this.props.setTimelineState({ highlightedMessageId: null });
    }
  }

  showMessage(message) {
    this.scrollToMessage(message);
  }

  onMarkerClick = (e, message) => {
    e.preventDefault();
    e.stopPropagation();
    const { executionPoint, executionPointTime, executionPointHasFrames, pauseId } = message;
    this.seek(executionPoint, executionPointTime, executionPointHasFrames, pauseId);
    this.showMessage(message);
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
    const { hoverTime } = this.props;
    const { hoveringOverMarker } = this.state;
    const mouseTime = this.getMouseTime(e);

    if (hoverTime != null && !hoveringOverMarker) {
      const event = mostRecentPaintOrMouseEvent(mouseTime);
      if (event) {
        this.seek(event.point, mouseTime);
      }
    }
  };

  seek(point, time, hasFrames, pauseId) {
    if (!point) {
      return null;
    }
    return this.props.seek(point, time, hasFrames, pauseId);
  }

  seekTime(targetTime) {
    if (targetTime == null) {
      return null;
    }

    const event = mostRecentPaintOrMouseEvent(targetTime);

    if (event) {
      // Seek to the exact time provided, even if it does not match up with a
      // paint event. This can cause some slight UI weirdness: resumes done in
      // the debugger will be relative to the point instead of the time,
      // so e.g. running forward could land at a point before the time itself.
      // This could be fixed but doesn't seem worth worrying about for now.
      this.seek(event.point, targetTime);
    }
  }

  goToNextPaint() {
    const { currentTime } = this.props;
    if (currentTime == this.zoomStartTime) {
      return;
    }

    const previous = previousPaintEvent(currentTime);
    if (!previous) {
      return;
    }

    this.seekTime(Math.max(previous.time, this.zoomStartTime));
  }

  goToPrevPaint() {
    const { currentTime } = this.props;
    if (currentTime == this.zoomEndTime) {
      return;
    }

    const next = nextPaintEvent(currentTime);
    if (!next) {
      return;
    }

    this.seekTime(Math.min(next.time, this.zoomEndTime));
  }

  /**
   * Playback the recording segment from `startTime` to `endTime`.
   * Optionally a `pauseTarget` may be given that will be seeked to after finishing playback.
   */
  async playback(startTime, endTime, pauseTarget) {
    if (pauseTarget) {
      assert(endTime <= pauseTarget.time);
    }

    let startDate = Date.now();
    let currentDate = startDate;
    let currentTime = startTime;
    let nextGraphicsTime;
    let nextGraphicsPromise;

    const prepareNextGraphics = () => {
      nextGraphicsTime = nextPaintOrMouseEvent(currentTime)?.time || this.zoomEndTime;
      nextGraphicsPromise = getGraphicsAtTime(nextGraphicsTime);
    };

    prepareNextGraphics();

    while (this.props.playback) {
      await new Promise(resolve => requestAnimationFrame(resolve));
      if (!this.props.playback) {
        return;
      }

      currentDate = Date.now();
      currentTime = startTime + (currentDate - startDate);

      if (currentTime > endTime) {
        log(`FinishPlayback`);
        if (pauseTarget) {
          this.seek(pauseTarget.point, pauseTarget.time, !!pauseTarget.frame);
        } else {
          this.seekTime(endTime);
        }
        this.props.setTimelineState({ currentTime: endTime, playback: null });
        return;
      }

      this.props.setTimelineState({
        currentTime,
        playback: { startTime, startDate, pauseTarget, time: currentTime },
      });

      if (currentTime >= nextGraphicsTime) {
        const { screen, mouse } = await nextGraphicsPromise;
        if (!this.props.playback) {
          return;
        }

        // playback may have stalled waiting for `nextGraphicsPromise` and would jump
        // in the next iteration in order to catch up. To avoid jumps of more than
        // 100 milliseconds, we reset `startTime` and `startDate` as if playback had
        // been started right now
        if (Date.now() - currentDate > 100) {
          startTime = currentTime;
          startDate = Date.now();
          this.props.setTimelineState({
            currentTime,
            playback: { startTime, startDate, pauseTarget, time: currentTime },
          });
        }

        if (screen) {
          paintGraphics(screen, mouse);
        }
        prepareNextGraphics();
      }
    }
  }

  async startPlayback() {
    log(`StartPlayback`);

    const { currentTime } = this.props;

    const startDate = Date.now();

    let startTime = currentTime;
    let startPoint = this.threadFront.currentPoint;

    if (currentTime == this.zoomEndTime) {
      startTime = this.zoomStartTime;
      const startEvent = mostRecentPaintOrMouseEvent(startTime);
      startPoint = startEvent ? startEvent.point : "0";
    }

    this.props.setTimelineState({
      playback: { startTime, startDate },
      currentTime: startTime,
    });

    const pauseTarget = await this.threadFront.resumeTarget(startPoint);

    if (!this.props.playback) {
      return;
    }

    const endTime = pauseTarget ? Math.min(pauseTarget.time, this.zoomEndTime) : this.zoomEndTime;
    this.playback(startTime, endTime, pauseTarget);
  }

  stopPlayback() {
    log(`StopPlayback`);

    if (this.props.playback) {
      this.seekTime(this.props.playback.time);
    }
    this.props.setTimelineState({ playback: null });
  }

  replayPlayback = () => {
    this.seekTime(0);
    this.startPlayback();
  };

  renderCommands() {
    const { playback, recordingDuration, currentTime } = this.props;

    if (currentTime == recordingDuration) {
      return (
        <div className="commands">
          <ReplayButton onClick={this.replayPlayback} />
        </div>
      );
    }

    return (
      <div className="commands">
        <button onClick={() => (playback ? this.stopPlayback() : this.startPlayback())}>
          {playback ? <div className="img pause-circle" /> : <div className="img play-circle-lg" />}
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
    const { messages, currentTime, highlightedMessageId, zoomRegion } = this.props;
    let visibleIndex;

    return messages.map((message, index) => {
      const messageEl = (
        <Message
          message={message}
          visibleIndex={visibleIndex}
          index={index}
          messages={messages}
          currentTime={currentTime}
          highlightedMessageId={highlightedMessageId}
          zoomRegion={zoomRegion}
          overlayWidth={this.overlayWidth}
          onMarkerClick={this.onMarkerClick}
          onMarkerMouseEnter={this.onMarkerMouseEnter}
          onMarkerMouseLeave={this.onMarkerMouseLeave}
        />
      );

      if (messageEl) {
        visibleIndex = index;
      }
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

  renderUnprocessedRegions() {
    return this.props.unprocessedRegions.map(this.renderUnprocessedRegion.bind(this));
  }

  renderUnprocessedRegion({ begin, end }) {
    let startOffset = this.getPixelOffset(begin);
    let endOffset = this.getPixelOffset(end);

    if (startOffset >= this.overlayWidth || endOffset <= 0) {
      return null;
    }

    if (startOffset < 0) {
      startOffset = 0;
    }

    if (endOffset > this.overlayWidth) {
      endOffset = this.overlayWidth;
    }

    return dom.span({
      className: "unscanned",
      style: {
        left: `${startOffset}px`,
        width: `${endOffset - startOffset}px`,
      },
    });
  }

  renderComments() {
    return (
      <>
        {hasFocusedComment && <div className="app-mask" onClick={unfocusComment} />}
        <Comments />
      </>
    );
  }

  render() {
    const { loaded, currentTime } = this.props;
    const percent = this.getVisiblePosition(currentTime) * 100;

    return div(
      {
        className: "replay-player",
      },
      this.renderCommands(),
      div(
        {
          className: classname("overlay-container", { paused: true }),
        },
        div(
          {
            className: classname("progressBar", { loaded }),
            ["data-progress"]: Math.ceil(percent),
            ref: a => (this.$progressBar = a),
            onMouseEnter: this.onPlayerMouseEnter,
            onMouseMove: this.onPlayerMouseMove,
            onMouseUp: this.onPlayerMouseUp,
          },
          div({
            className: "progress-line end",
          }),
          div({
            className: "progress-line",
            style: { width: `${percent}%` },
          }),
          div({ className: "message-container" }, ...this.renderMessages()),
          ...this.renderUnprocessedRegions(),
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
    highlightedMessageId: selectors.getHighlightedMessageId(state),
    hoveredMessage: selectors.getHoveredMessage(state),
    unprocessedRegions: selectors.getUnprocessedRegions(state),
    recordingDuration: selectors.getRecordingDuration(state),
    timelineDimensions: selectors.getTimelineDimensions(state),
    loaded: selectors.getTimelineLoaded(state),
    messages: selectors.getMessagesForTimeline(state),
  }),
  {
    setTimelineToTime: actions.setTimelineToTime,
    hideTooltip: actions.hideTooltip,
    setTimelineState: actions.setTimelineState,
    updateTimelineDimensions: actions.updateTimelineDimensions,
    seek: actions.seek,
  }
)(Timeline);
