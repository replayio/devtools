/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// The WebReplayPlayer is the React component which renders the devtools
// timeline. It also manages which graphics are currently being rendered.

const { Component } = require("react");
const ReactDOM = require("react-dom");
const dom = require("react-dom-factories");
const PropTypes = require("react-prop-types");
const { sortBy, range } = require("lodash");
const { SVG } = require("image/svg");
const { log } = require("protocol/socket");
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

const { LocalizationHelper } = require("devtools/shared/l10n");
const L10N = new LocalizationHelper(
  "devtools/client/locales/toolbox.properties"
);

const getFormatStr = (key, a) => L10N.getFormatStr(`toolbox.replay.${key}`, a);

const { div } = dom;

const markerWidth = 7;
const imgDir = "devtools/skin/images";

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
        webkitMaskImage: `url("data:image/svg+xml;base64,${base64}")`,
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

  return sortBy(messages, (message) =>
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

class WebReplayPlayer extends Component {
  static get propTypes() {
    return {
      toolbox: PropTypes.object,
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
      hoveredMessageOffset: null,
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
  }

  componentDidMount() {
    this.overlayWidth = this.updateOverlayWidth();
    this.threadFront.ensureProcessed(
      this.onMissingRegions.bind(this),
      this.onUnprocessedRegions.bind(this)
    );

    this.toolbox.getPanelWhenReady("webconsole").then((panel) => {
      const consoleFrame = panel.hud.ui;
      consoleFrame.on("message-hover", this.onConsoleMessageHover.bind(this));
      consoleFrame.wrapper.subscribeToStore(this.onConsoleUpdate.bind(this));
    });

    this.toolbox.webReplayPlayer = this;
    this.threadFront.on("paused", this.onPaused.bind(this));
    this.threadFront.setOnEndpoint(this.onEndpoint.bind(this));
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
    if (gCurrentScreenShot) {
      addLastScreen(gCurrentScreenShot, point, time);
    }
  }

  get toolbox() {
    return this.props.toolbox;
  }

  get console() {
    return this.toolbox.getPanel("webconsole");
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

  onPaused(packet) {
    throw new Error("NYI");
    if (packet) {
      let { executionPoint } = packet;
      const closestMessage = this.getClosestMessage(executionPoint);

      let pausedMessage;
      if (executionPoint) {
        pausedMessage = this.state.messages
          .filter((message) => message.executionPoint)
          .find((message) =>
            pointEquals(message.executionPoint, executionPoint)
          );
      } else {
        executionPoint = this.state.executionPoint;
      }

      this.setState({
        executionPoint,
        closestMessage,
        pausedMessage,
      });
    }
  }

  onMissingRegions(regions) {
    log(`MissingRegions ${JSON.stringify(regions)}`);
  }

  onUnprocessedRegions({ regions }) {
    log(`UnprocessedRegions ${JSON.stringify(regions)}`);
    this.setState({ unprocessedRegions: regions });
  }

  onConsoleUpdate(consoleState) {
    const {
      messages: { visibleMessages, messagesById },
    } = consoleState;

    if (visibleMessages != this.state.visibleMessages) {
      let messages = visibleMessages
        .map((id) => messagesById.get(id))
        .filter(
          (message) => message.source == "console-api" || isError(message)
        );

      messages = sortBy(messages, (message) => getMessageProgress(message));

      this.setState({ messages, visibleMessages, shouldAnimate: false });
    }
  }

  onConsoleMessageHover(type, message) {
    if (type == "mouseleave") {
      return this.setState({ highlightedMessage: null });
    }

    if (type == "mouseenter") {
      return this.setState({ highlightedMessage: message.id });
    }

    return null;
  }

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

  onMessageMouseEnter(message, offset) {
    this.setState({ hoveredMessageOffset: offset });
    this.previewLocation(message);
    this.showMessage(message);
  }

  onMessageMouseLeave() {
    this.setState({ hoveredMessageOffset: null });
    this.clearPreviewLocation();
  }

  async previewLocation(closestMessage) {
    const dbg = await this.toolbox.loadTool("jsdebugger");
    const location = getMessageLocation(closestMessage);
    if (location) {
      dbg.previewPausedLocation(location);
    }
  }

  async clearPreviewLocation() {
    const dbg = await this.toolbox.loadTool("jsdebugger");
    dbg.clearPreviewPausedLocation();
  }

  async onProgressBarMouseMove(e) {
    const { hoverTime, recordingDuration } = this.state;
    if (!recordingDuration) {
      return;
    }

    const mouseTime = this.getMouseTime(e);
    const { point, time } = closestPaintOrMouseEvent(mouseTime);

    if (hoverTime != time) {
      this.setState({ hoverTime: time });
      const { screen, mouse } = await getGraphicsAtTime(time);
      if (time == this.state.hoverTime) {
        paintGraphics(screen, mouse);
      }
    }
  }

  onPlayerMouseLeave() {
    this.unhighlightConsoleMessage();
    this.clearPreviewLocation();

    // Restore the normal graphics.
    paintGraphics(gCurrentScreenShot, gCurrentMouse);

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
    const { hoverTime, startDragTime, currentTime } = this.state;
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
    } else if (e.altKey) {
      const which = e.shiftKey ? "zoomEndTime" : "zoomStartTime";
      this.setTimelineBoundary({ time: hoverTime, which });
    } else if (startDragTime != null && hoverTime != null) {
      this.seekTime(hoverTime);
    }
  }

  seek(point, time) {
    if (!point) {
      return null;
    }

    return this.threadFront.timeWarp(point, time);
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
      paintGraphics(screen, mouse);
      const next = this.nextPlaybackTime(time);
      if (next) {
        log(`WebReplayPlayer PlaybackNext`);
        getGraphicsAtTime(next).then(({ screen, mouse }) => {
          this.playbackPaintFinished(next, screen, mouse);
        });
        this.setState({ playback: { time: next }, currentTime: next });
      } else {
        log(`WebReplayPlayer StopPlayback`);
        this.seekTime(time);
        this.setState({ playback: null });
      }
    }
  }

  startPlayback() {
    log(`WebReplayPlayer StartPlayback`);

    let time = this.nextPlaybackTime(this.state.currentTime);
    if (!time) {
      time = this.state.zoomStartTime;
    }
    getGraphicsAtTime(time).then(({ screen, mouse }) => {
      this.playbackPaintFinished(time, screen, mouse);
    });

    this.setState({ playback: { time }, currentTime: time });
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

  renderCommands() {
    const {
      playback,
      zoomStartTime,
      zoomEndTime,
      recordingDuration,
    } = this.state;

    const zoomed = zoomStartTime != 0 || zoomEndTime != recordingDuration;

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

      CommandButton({
        className: "",
        active: zoomed,
        img: "zoomout",
        onClick: () => this.doZoomOut(),
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
      onClick: (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.seek(message.executionPoint);
      },
      onMouseEnter: () => this.onMessageMouseEnter(message, offset),
      onMouseLeave: () => this.onMessageMouseLeave(),
    });
  }

  renderMessages() {
    const messages = this.state.messages;
    return messages.map((message, index) => this.renderMessage(message, index));
  }

  renderHoverPoint() {
    const { hoverTime, hoveredMessageOffset } = this.state;
    if (hoverTime == null || hoveredMessageOffset) {
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
    const tickSize = this.getTickSize();
    const ticks = Math.round(this.overlayWidth / tickSize);
    return range(ticks).map((value, index) => this.renderTick(index));
  }

  renderTick(index) {
    const { currentTime, hoveredMessageOffset } = this.state;
    const tickSize = this.getTickSize();
    const offset = Math.round(this.getPixelOffset(currentTime));
    const position = index * tickSize;
    const isFuture = position > offset;
    const shouldHighlight = hoveredMessageOffset > position;

    return dom.span({
      className: classname("tick", {
        future: isFuture,
        highlight: shouldHighlight,
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
          )
        )
      )
    );
  }
}

module.exports = WebReplayPlayer;
