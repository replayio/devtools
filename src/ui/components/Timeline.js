/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// The WebReplayPlayer is the React component which renders the devtools
// timeline. It also manages which graphics are currently being rendered.

import { connect } from "react-redux";
import { Component } from "react";
import ReactDOM from "react-dom";
import dom from "react-dom-factories";
import PropTypes from "prop-types";
import { sortBy, range } from "lodash";

import { SVG } from "image/svg";
import { sendMessage, log } from "protocol/socket";
const {
  closestPaintOrMouseEvent,
  nextPaintOrMouseEvent,
  nextPaintEvent,
  previousPaintEvent,
  getGraphicsAtTime,
  paintGraphics,
  addLastScreen,
} = require("protocol/graphics");
const {
  pointEquals,
  pointPrecedes,
} = require("protocol/execution-point-utils.js");

import { actions } from "../actions";
import { selectors } from "../reducers";

import { LocalizationHelper } from "devtools/shared/l10n";
const L10N = new LocalizationHelper(
  "devtools/client/locales/toolbox.properties"
);

const getFormatStr = (key, a) => L10N.getFormatStr(`toolbox.replay.${key}`, a);

const { div } = dom;

import "./Timeline.css";

const markerWidth = 7;
const imgDir = "devtools/skin/images";

const url = new URL(window.location.href);
const recordingId = url.searchParams.get("id");

function classname(name, bools) {
  for (const key in bools) {
    if (bools[key]) {
      name += ` ${key}`;
    }
  }

  return name;
}

function isError(message) {
  return message.source === "javascript" && message.level === "error";
}

function CommandButton({ img, className, onClick, active }) {
  const images = {
    next: SVG.NextButton,
    previous: SVG.NextButton,
    pause: SVG.ReplayPause,
    play: SVG.ReplayResume,
    zoomout: SVG.ZoomOut,
  };

  const attrs = {
    className: classname(`command-button ${className}`, { active }),
    onClick,
  };

  attrs.title = L10N.getStr(`toolbox.replay.${img}`);

  const base64 = btoa(images[img]);

  return dom.div(
    attrs,
    dom.div({
      className: `btn ${img} ${className}`,
      style: {
        WebkitMaskImage: `url("data:image/svg+xml;base64,${base64}")`,
        maskImage: `url("data:image/svg+xml;base64,${base64}")`,
      },
    })
  );
}

function getMessageProgress(message) {
  return getProgress(message.executionPoint);
}

function getProgress(executionPoint) {
  return executionPoint && executionPoint.progress;
}

function getClosestMessage(messages, executionPoint) {
  const progress = getProgress(executionPoint);

  return sortBy(messages, message =>
    Math.abs(progress - getMessageProgress(message))
  )[0];
}

function sameLocation(m1, m2) {
  const f1 = m1.frame;
  const f2 = m2.frame;

  return (
    f1.source === f2.source && f1.line === f2.line && f1.column === f2.column
  );
}

function getMessageLocation(message) {
  if (!message.frame) {
    return null;
  }
  const {
    frame: { source, line, column },
  } = message;
  return { sourceUrl: source, line, column };
}

// Graphics for the place where the thread is currently paused.
let gCurrentScreenShot;
let gCurrentMouse;

export class Timeline extends Component {
  static get propTypes() {
    return {
      toolbox: PropTypes.object,
      console: PropTypes.object,
    };
  }

  constructor(props) {
    super(props);
    this.state = {
      currentTime: 0,
      hoverTime: null,
      startDragTime: null,
      playback: null,
      messages: [],
      highlightedMessage: null,
      hoveredMessage: null,
      unprocessedRegions: [],
      shouldAnimate: true,
      zoomStartTime: 0,
      zoomEndTime: 0,
      recordingDuration: 0,
    };

    this.hoveredMessage = null;
    this.overlayWidth = 1;

    this.onProgressBarMouseMove = this.onProgressBarMouseMove.bind(this);
    this.onPlayerMouseLeave = this.onPlayerMouseLeave.bind(this);
    this.onPlayerMouseDown = this.onPlayerMouseDown.bind(this);
    this.onPlayerMouseUp = this.onPlayerMouseUp.bind(this);

    gToolbox.timeline = this;
  }

  async componentDidMount() {
    this.overlayWidth = this.updateOverlayWidth();
    this.threadFront.ensureProcessed(
      this.onMissingRegions.bind(this),
      this.onUnprocessedRegions.bind(this)
    );

    const consoleFrame = this.console.hud.ui;
    consoleFrame.on("message-hover", this.onConsoleMessageHover);
    consoleFrame.wrapper.subscribeToStore(this.onConsoleUpdate);

    this.threadFront.on("paused", this.onPaused.bind(this));
    this.threadFront.setOnEndpoint(this.onEndpoint.bind(this));

    const description = await this.threadFront.getDescription(recordingId);
    this.setRecordingDescription(description);
  }

  componentDidUpdate(prevProps, prevState) {
    this.overlayWidth = this.updateOverlayWidth();

    if (prevState.closestMessage != this.state.closestMessage) {
      this.scrollToMessage(this.state.closestMessage);
    }
  }

  setRecordingDescription({ duration, lastScreen }) {
    this.setState({
      recordingDuration: duration,
      zoomEndTime: duration,
      currentTime: duration,
    });

    // Paint the last screen to get it up quickly, even though we don't know yet
    // which execution point this is and have warped here.
    gCurrentScreenShot = lastScreen;
    paintGraphics(lastScreen);
  }

  onEndpoint({ point, time }) {
    addLastScreen(gCurrentScreenShot, point, time);
  }

  get toolbox() {
    return this.props.toolbox;
  }

  get console() {
    return this.toolbox.getPanel("console");
  }

  get debugger() {
    return this.toolbox.getPanel("debugger");
  }

  get threadFront() {
    return this.toolbox.threadFront;
  }

  getTickSize() {
    const { zoomStartTime, zoomEndTime, recordingDuration } = this.state;

    const minSize = 10;

    if (zoomStartTime == zoomEndTime) {
      return minSize;
    }

    const maxSize = this.overlayWidth / 10;
    const ratio = (zoomEndTime - zoomStartTime) / recordingDuration;
    return (1 - ratio) * maxSize + minSize;
  }

  getClosestMessage(point) {
    return getClosestMessage(this.state.messages, point);
  }

  // Get the time for a mouse event within the recording.
  getMouseTime(e) {
    const { zoomStartTime, zoomEndTime } = this.state;

    const { left, width } = e.currentTarget.getBoundingClientRect();
    const clickLeft = e.clientX;

    const clickPosition = (clickLeft - left) / width;
    return zoomStartTime + (zoomEndTime - zoomStartTime) * clickPosition;
  }

  onMissingRegions(regions) {
    log(`MissingRegions ${JSON.stringify(regions)}`);
  }

  onUnprocessedRegions({ regions }) {
    log(`UnprocessedRegions ${JSON.stringify(regions)}`);
    this.setState({ unprocessedRegions: regions });
  }

  onConsoleUpdate = consoleState => {
    const {
      messages: { visibleMessages, messagesById },
    } = consoleState;

    if (visibleMessages != this.state.visibleMessages) {
      let messages = visibleMessages
        .map(id => messagesById.get(id))
        .filter(message => message.source == "console-api" || isError(message));

      messages = sortBy(messages, message => getMessageProgress(message));

      this.setState({ messages, visibleMessages, shouldAnimate: false });
    }
  };

  onConsoleMessageHover = (type, message) => {
    if (type == "mouseleave") {
      return this.setState({ highlightedMessage: null });
    }

    if (type == "mouseenter") {
      return this.setState({ highlightedMessage: message.id });
    }

    return null;
  };

  setTimelineBoundary({ time, which }) {
    this.setState({ [which]: time });
  }

  findMessage(message) {
    const consoleOutput = this.console.hud.ui.outputNode;
    return consoleOutput.querySelector(
      `.message[data-message-id="${message.id}"]`
    );
  }

  scrollToMessage(message) {
    if (!message) {
      return;
    }

    const element = this.findMessage(message);
    const consoleOutput = this.console.hud.ui.outputNode;

    if (element) {
      const consoleHeight = consoleOutput.getBoundingClientRect().height;
      const elementTop = element.getBoundingClientRect().top;
      if (elementTop < 30 || elementTop + 50 > consoleHeight) {
        element.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    }
  }

  unhighlightConsoleMessage() {
    if (this.hoveredMessage) {
      this.hoveredMessage.classList.remove("highlight");
    }
  }

  highlightConsoleMessage(message) {
    if (!message) {
      return;
    }

    const element = this.findMessage(message);
    if (!element) {
      return;
    }

    this.unhighlightConsoleMessage();
    element.classList.add("highlight");
    this.hoveredMessage = element;
  }

  showMessage(message) {
    this.highlightConsoleMessage(message);
    this.scrollToMessage(message);
  }

  onMessageMouseEnter(message) {
    this.setState({ hoveredMessage: message });
    this.previewLocation(message);
    this.showMessage(message);
  }

  onMessageMouseLeave() {
    this.setState({ hoveredMessage: null });
    this.clearPreviewLocation();
  }

  async previewLocation(closestMessage) {
    const location = getMessageLocation(closestMessage);
    if (location) {
      this.debugger?.previewPausedLocation(location);
    }
  }

  async clearPreviewLocation() {
    this.debugger?.clearPreviewPausedLocation();
  }

  async onProgressBarMouseMove(e) {
    const { hoverTime, recordingDuration } = this.state;
    const { updateTooltip } = this.props;
    if (!recordingDuration) {
      return;
    }

    const mouseTime = this.getMouseTime(e);
    const { point, time } = closestPaintOrMouseEvent(mouseTime);

    if (hoverTime != time) {
      this.setState({ hoverTime: mouseTime });
      const { screen, mouse } = await getGraphicsAtTime(time);
      updateTooltip({ screen, left: this.getPixelOffset(hoverTime) });
    }
  }

  onPlayerMouseLeave() {
    const { updateTooltip } = this.props;

    this.unhighlightConsoleMessage();
    this.clearPreviewLocation();

    // Restore the normal graphics.

    updateTooltip(null);
    this.setState({ hoverTime: null, startDragTime: null });
  }

  onPlayerMouseDown() {
    const { hoverTime } = this.state;
    if (hoverTime != null) {
      this.setState({ startDragTime: hoverTime });
    }
  }

  zoomedRegion() {
    const { startDragTime, hoverTime } = this.state;
    if (startDragTime == null || hoverTime == null) {
      return null;
    }
    const dragPos = this.getVisiblePosition(startDragTime);
    const hoverPos = this.getVisiblePosition(hoverTime);
    if (Math.abs(dragPos - hoverPos) < 0.02) {
      return null;
    }
    if (dragPos < hoverPos) {
      return { zoomStartTime: startDragTime, zoomEndTime: hoverTime };
    }
    return { zoomStartTime: hoverTime, zoomEndTime: startDragTime };
  }

  onPlayerMouseUp(e) {
    const { hoverTime, startDragTime, currentTime, hoveredMessage } = this.state;
    const mouseTime = this.getMouseTime(e);

    this.setState({ startDragTime: null });

    const zoomInfo = this.zoomedRegion();
    if (zoomInfo) {
      const { zoomStartTime, zoomEndTime } = zoomInfo;
      this.setState({ zoomStartTime, zoomEndTime });

      if (currentTime < zoomStartTime) {
        this.seekTime(zoomStartTime);
      } else if (zoomEndTime < currentTime) {
        this.seekTime(zoomEndTime);
      }
    } else if (startDragTime != null && hoverTime != null && !hoveredMessage) {
      const { point } = closestPaintOrMouseEvent(mouseTime);
      this.seek(point, mouseTime);
    }
  }

  seek(point, time, hasFrames) {
    if (!point) {
      return null;
    }

    return this.threadFront.timeWarp(point, time, hasFrames);
  }

  seekTime(targetTime) {
    if (targetTime == null) {
      return null;
    }

    const { point, time } = closestPaintOrMouseEvent(targetTime);
    this.seek(point, time);
  }

  async onPaused({ time }) {
    this.setState({ currentTime: time });

    const { screen, mouse } = await getGraphicsAtTime(time);
    if (this.state.currentTime == time) {
      gCurrentScreenShot = screen;
      gCurrentMouse = mouse;
      paintGraphics(screen, mouse);
    }
  }

  doPrevious() {
    const { currentTime } = this.state;
    if (currentTime == this.state.zoomStartTime) {
      return;
    }

    const previous = previousPaintEvent(currentTime);
    if (!previous) {
      return;
    }

    this.seekTime(Math.max(previous.time, this.state.zoomStartTime));
  }

  doNext() {
    const { currentTime } = this.state;
    if (currentTime == this.state.zoomEndTime) {
      return;
    }

    const next = nextPaintEvent(currentTime);
    if (!next) {
      return;
    }

    this.seekTime(Math.min(next.time, this.state.zoomEndTime));
  }

  nextPlaybackTime(time) {
    if (time == this.state.zoomEndTime) {
      return null;
    }

    let nextEvent = nextPaintOrMouseEvent(time);

    // Skip over mouse events that are too close to the current time.
    while (nextEvent && nextEvent.clientX && nextEvent.time < time + 100) {
      nextEvent = nextPaintOrMouseEvent(nextEvent.time);
    }

    if (nextEvent && nextEvent.time < this.state.zoomEndTime) {
      return nextEvent.time;
    }

    return this.state.zoomEndTime;
  }

  playbackPaintFinished(time, screen, mouse) {
    if (this.state.playback && time == this.state.playback.time) {
      const { startTime, startDate } = this.state.playback;
      paintGraphics(screen, mouse);
      const next = this.nextPlaybackTime(time);
      if (next) {
        log(`WebReplayPlayer PlaybackNext`);

        // For now we play back at 1x (or slower, while screens load).
        const paintTime = startDate + next - startTime;

        getGraphicsAtTime(next).then(({ screen, mouse }) => {
          const now = Date.now();
          setTimeout(() => {
            this.playbackPaintFinished(next, screen, mouse);
          }, Math.max(0, paintTime - now));
        });
        this.setState({
          playback: { time: next, startTime, startDate },
          currentTime: next,
        });
      } else {
        log(`WebReplayPlayer StopPlayback`);
        this.seekTime(time);
        this.setState({ playback: null });
      }
    }
  }

  startPlayback() {
    log(`WebReplayPlayer StartPlayback`);

    const startTime = this.state.currentTime;
    const startDate = Date.now();

    let time = this.nextPlaybackTime(this.state.currentTime);
    if (!time) {
      time = this.state.zoomStartTime;
    }
    getGraphicsAtTime(time).then(({ screen, mouse }) => {
      this.playbackPaintFinished(time, screen, mouse);
    });

    this.setState({
      playback: { time, startTime, startDate },
      currentTime: time,
    });
  }

  stopPlayback() {
    log(`WebReplayPlayer StopPlayback`);

    if (this.state.playback) {
      this.seekTime(this.state.playback.time);
    }
    this.setState({ playback: null });
  }

  doZoomOut() {
    this.setState({
      zoomStartTime: 0,
      zoomEndTime: this.state.recordingDuration,
    });
  }

  renderZoom() {
    const { zoomStartTime, zoomEndTime, recordingDuration } = this.state;
    const zoomed = zoomStartTime != 0 || zoomEndTime != recordingDuration;

    return CommandButton({
      className: "",
      active: zoomed,
      img: "zoomout",
      onClick: () => this.doZoomOut(),
    });
  }

  renderCommands() {
    const { playback } = this.state;

    return [
      CommandButton({
        className: "",
        active: !playback,
        img: "previous",
        onClick: () => this.doPrevious(),
      }),

      CommandButton({
        className: "primary",
        active: true,
        img: playback ? "pause" : "play",
        onClick: () => (playback ? this.stopPlayback() : this.startPlayback()),
      }),

      CommandButton({
        className: "",
        active: !playback,
        img: "next",
        onClick: () => this.doNext(),
      }),
    ];
  }

  updateOverlayWidth() {
    const el = ReactDOM.findDOMNode(this).querySelector(".progressBar");
    return el ? el.clientWidth : 1;
  }

  // calculate pixel distance from two times
  getPixelDistance(to, from) {
    const toPos = this.getVisiblePosition(to);
    const fromPos = this.getVisiblePosition(from);

    return (toPos - fromPos) * this.overlayWidth;
  }

  // Get the position of a time on the visible part of the timeline,
  // in the range [0, 1].
  getVisiblePosition(time) {
    const { zoomStartTime, zoomEndTime } = this.state;

    if (time <= zoomStartTime) {
      return 0;
    }

    if (time >= zoomEndTime) {
      return 1;
    }

    return (time - zoomStartTime) / (zoomEndTime - zoomStartTime);
  }

  // Get the pixel offset for a time.
  getPixelOffset(time) {
    return this.getVisiblePosition(time) * this.overlayWidth;
  }

  renderMessage(message, index) {
    const {
      messages,
      currentTime,
      pausedMessage,
      highlightedMessage,
    } = this.state;

    const offset = this.getPixelOffset(message.executionPointTime);
    const previousMessage = messages[index - 1];

    if (offset < 0) {
      return null;
    }

    // Check to see if two messages overlay each other on the timeline
    const isOverlayed =
      previousMessage &&
      this.getPixelDistance(
        message.executionPointTime,
        previousMessage.executionPointTime
      ) < markerWidth;

    // Check to see if a message appears after the current execution point
    const isFuture =
      this.getPixelDistance(message.executionPointTime, currentTime) >
      markerWidth / 2;

    const isHighlighted = highlightedMessage == message.id;

    const atPausedLocation =
      pausedMessage && sameLocation(pausedMessage, message);

    let frameLocation = "";
    if (message.frame) {
      const { source, line, column } = message.frame;
      const filename = source.split("/").pop();
      frameLocation = `${filename}:${line}`;
      if (column > 100) {
        frameLocation += `:${column}`;
      }
    }

    return dom.a({
      className: classname("message", {
        overlayed: isOverlayed,
        future: isFuture,
        highlighted: isHighlighted,
        location: atPausedLocation,
      }),
      style: {
        left: `${Math.max(offset - markerWidth / 2, 0)}px`,
        zIndex: `${index + 100}`,
      },
      title: getFormatStr("jumpMessage2", frameLocation),
      onClick: e => {
        e.preventDefault();
        e.stopPropagation();
        const {
          executionPoint,
          executionPointTime,
          executionPointHasFrames,
        } = message;
        this.seek(executionPoint, executionPointTime, executionPointHasFrames);
      },
      onMouseEnter: () => this.onMessageMouseEnter(message),
      onMouseLeave: () => this.onMessageMouseLeave(),
    });
  }

  renderMessages() {
    const messages = this.state.messages;
    return messages.map((message, index) => this.renderMessage(message, index));
  }

  renderHoverPoint() {
    const { hoverTime, hoveredMessage, screen } = this.state;
    if (hoverTime == null || hoveredMessage) {
      return [];
    }
    const offset = this.getPixelOffset(hoverTime);
    return [
      dom.span({
        className: "hoverPoint",
        style: {
          left: `${Math.max(offset - markerWidth / 2, 0)}px`,
          zIndex: 1000,
        },
      }),
    ];
  }

  renderTicks() {
    return [];
  }

  renderTick(index) {
    const { currentTime } = this.state;
    const tickSize = this.getTickSize();
    const offset = Math.round(this.getPixelOffset(currentTime));
    const position = index * tickSize;
    const isFuture = position > offset;

    return dom.span({
      className: classname("tick", {
        future: isFuture,
        highlight: true,
      }),
      style: {
        left: `${position}px`,
        width: `${tickSize}px`,
      },
    });
  }

  renderUnprocessedRegions() {
    return this.state.unprocessedRegions.map(
      this.renderUnprocessedRegion.bind(this)
    );
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

  renderZoomedRegion() {
    const info = this.zoomedRegion();
    if (!info) {
      return [];
    }

    let startOffset = this.getPixelOffset(info.zoomStartTime);
    let endOffset = this.getPixelOffset(info.zoomEndTime);

    return [
      dom.span({
        className: "untraversed",
        style: {
          left: "0px",
          width: `${startOffset}px`,
        },
      }),
      dom.span({
        className: "untraversed",
        style: {
          left: `${endOffset}px`,
          width: `${this.overlayWidth - endOffset}px`,
        },
      }),
    ];
  }

  render() {
    const percent = this.getVisiblePosition(this.state.currentTime) * 100;

    const { shouldAnimate } = this.state;
    return div(
      {
        className: "webreplay-player",
      },
      div(
        {
          id: "overlay",
          className: classname("", { paused: true }),
        },
        div(
          {
            className: classname("overlay-container", {
              animate: shouldAnimate,
            }),
          },
          div({ className: "commands" }, ...this.renderCommands()),
          div(
            {
              className: "progressBar",
              onMouseMove: this.onProgressBarMouseMove,
              onMouseLeave: this.onPlayerMouseLeave,
              onMouseDown: this.onPlayerMouseDown,
              onMouseUp: this.onPlayerMouseUp,
            },
            div({
              className: "progress",
              style: { width: `${percent}%` },
            }),
            div({
              className: "progress-line",
              style: { width: `${percent}%` },
            }),
            div({
              className: "progress-line end",
              style: { left: `${percent}%`, width: `${100 - percent}%` },
            }),
            ...this.renderMessages(),
            ...this.renderHoverPoint(),
            ...this.renderTicks(),
            ...this.renderUnprocessedRegions(),
            ...this.renderZoomedRegion()
          ),
          this.renderZoom()
        )
      )
    );
  }
}

export default connect(state => ({}), {
  updateTooltip: actions.updateTooltip,
})(Timeline);
