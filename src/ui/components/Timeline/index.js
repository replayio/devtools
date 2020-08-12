/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// React component which renders the devtools timeline and manages which
// graphics are currently being rendered.

import { connect } from "react-redux";
import { Component } from "react";
import ReactDOM from "react-dom";
import React from "react";

import dom from "react-dom-factories";
import PropTypes from "prop-types";
import { sortBy, range } from "lodash";

import { SVG } from "image/svg";
import { sendMessage, log } from "protocol/socket";
const {
  mostRecentPaintOrMouseEvent,
  nextPaintOrMouseEvent,
  nextPaintEvent,
  previousPaintEvent,
  getGraphicsAtTime,
  paintGraphics,
  setResizeTimelineCallback,
} = require("protocol/graphics");
const { clamp } = require("protocol/utils");

import { actions } from "../../actions";
import { selectors } from "../../reducers";
import { features } from "../../utils/prefs";

import { LocalizationHelper } from "devtools/shared/l10n";
const L10N = new LocalizationHelper("devtools/client/locales/toolbox.properties");

const getFormatStr = (key, a) => L10N.getFormatStr(`toolbox.replay.${key}`, a);

const { div } = dom;

import "./Timeline.css";

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
    comment: SVG.Comment,
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

function createCommentElement(comment, callbacks) {
  const element = document.createElement("div");

  document.body.appendChild(element);
  element.className = "comment-box";
  element.style.position = "absolute";
  element.style.left = "0px";
  element.style.top = "0px";

  let contentsElement;

  const closeButton = document.createElement("button");
  closeButton.className = "comment-close";
  element.appendChild(closeButton);
  closeButton.addEventListener("click", callbacks.closeComment);

  const jumpButton = document.createElement("button");
  jumpButton.className = "comment-jump";
  element.appendChild(jumpButton);
  jumpButton.addEventListener("click", callbacks.jumpToComment);

  const confirmButton = document.createElement("button");
  confirmButton.className = "comment-confirm";
  element.appendChild(confirmButton);
  confirmButton.addEventListener("click", () => {
    comment.contents = contentsElement.value;
    createContentsElement(false);
    callbacks.updateComment();
  });

  const writeButton = document.createElement("button");
  writeButton.className = "comment-write";
  element.appendChild(writeButton);
  writeButton.addEventListener("click", () => {
    comment.contents = contentsElement.innerText;
    createContentsElement(true);
  });

  createContentsElement(!comment.contents);
  return element;

  function createContentsElement(isInput) {
    if (contentsElement) {
      contentsElement.remove();
    }
    if (isInput) {
      contentsElement = document.createElement("textarea");
      contentsElement.className = "comment-input";
      contentsElement.value = comment.contents;
      element.appendChild(contentsElement);
      contentsElement.focus();
      writeButton.style.display = "none";
      confirmButton.style.display = "inline";
    } else {
      contentsElement = document.createElement("div");
      contentsElement.className = "comment-contents";
      contentsElement.innerText = comment.contents;
      element.appendChild(contentsElement);
      // Comments identifying users can't be edited.
      writeButton.style.display = comment.isUser ? "none" : "inline";
      confirmButton.style.display = "none";
    }
  }
}

// Map id => element for displayed comments
const gCommentElements = new Map();

function ensureCommentElement(comment, callbacks) {
  let elem = gCommentElements.get(comment.id);
  if (!elem) {
    elem = createCommentElement(comment, callbacks);
    gCommentElements.set(comment.id, elem);
  }
  return elem;
}

// Remove any comment elements that are not visible in the given comments.
// This should be React-ified better...
function removeOldCommentElements(comments) {
  for (const [id, elem] of gCommentElements) {
    if (!comments.some(c => c.id == id && c.visible)) {
      elem.remove();
      gCommentElements.delete(id);
    }
  }
}

// For avoiding issues with floating point arithmetic.
const TolerateOverlap = 2;

// function commentsOverlap(c1, c2) {
//   if (c1.left + c1.width < c2.left + TolerateOverlap) {
//     return false;
//   }
//   if (c1.left + TolerateOverlap > c2.left + c2.width) {
//     return false;
//   }
//   if (c1.top + c1.height < c2.top + TolerateOverlap) {
//     return false;
//   }
//   if (c1.top + TolerateOverlap > c2.top + c2.height) {
//     return false;
//   }
//   return true;
// }

// Try to find a location where we can render a comment that won't overlap with
// any other existing comment.
// function pickCommentElementLocation(left, top, { width, height }, existingComments) {
//   const initialTop = top;

//   // Whether we've already slid left or right.
//   let direction;

//   while (true) {
//     // If the comment overlaps one we already rendered, slide its location and
//     // restart the loop to watch for overlaps at the new location. This loop
//     // will eventually terminate it, since we can slide arbitrarily far off the
//     // screen (we'll clamp the final location to the visible area though).
//     let slide = false;
//     for (const existing of existingComments) {
//       if (!commentsOverlap({ left, top, width, height }, existing)) {
//         continue;
//       }
//       // Try sliding up first.
//       const newTop = existing.top - height;
//       if (newTop >= 0) {
//         top = newTop;
//         slide = true;
//         break;
//       }
//       // Try sliding either left or right, depending on our relation with the
//       // existing comment. If we already slid in one of these directions, keep
//       // going in that same direction.
//       if (!direction) {
//         direction = left < existing.left ? "left" : "right";
//       }
//       left = direction == "left" ? existing.left - width : existing.left + existing.width;
//       top = initialTop;
//       slide = true;
//     }
//     if (!slide) {
//       // We found a place to render the comment.
//       existingComments.push({ left, top, width, height });
//       return {
//         left: clamp(left, 0, window.innerWidth - width),
//         top,
//       };
//     }
//   }
// }

function sameLocation(m1, m2) {
  const f1 = m1.frame;
  const f2 = m2.frame;

  return f1.source === f2.source && f1.line === f2.line && f1.column === f2.column;
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

// Metadata key used to store comments.
const CommentsMetadata = "devtools-comments";

// When viewing a recording, we add a comment and move it around to indicate the
// point we are currently looking at. Since we don't have user accounts, make up
// a short name to identify us when other people view the recording.
//const UserComment = `User #${(Math.random() * 100) | 0}`;

export class Timeline extends Component {
  static get propTypes() {
    return {
      toolbox: PropTypes.object,
      console: PropTypes.object,
    };
  }

  get zoomStartTime() {
    return this.props.zoomRegion.startTime;
  }

  get zoomEndTime() {
    return this.props.zoomRegion.endTime;
  }

  constructor(props) {
    super(props);
    this.state = {
      comments: [],
      numResizes: 0,
    };

    this.overlayWidth = 1;

    gToolbox.timeline = this;
  }

  async componentDidMount() {
    this.updateOverlayWidth();
    this.overlayWidth = this.updateOverlayWidth();
    this.threadFront.ensureProcessed(this.onMissingRegions, this.onUnprocessedRegions);

    const consoleFrame = this.console.hud.ui;
    consoleFrame.on("message-hover", this.onConsoleMessageHover);
    consoleFrame.wrapper.subscribeToStore(this.onConsoleUpdate);

    // this.threadFront.watchMetadata(CommentsMetadata, this.onCommentsUpdate.bind(this));
    // Use this stupid hack to re-render the timeline whenever the canvas is
    // resized so that we reposition any visible comments.
    setResizeTimelineCallback(() => {
      this.setState({ numResizes: this.state.numResizes + 1 });
    });
  }

  componentDidUpdate(prevProps, prevState) {
    this.updateOverlayWidth();

    if (prevState.closestMessage != this.props.closestMessage) {
      this.scrollToMessage(this.props.closestMessage);
    }
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

  // Get the time for a mouse event within the recording.
  getMouseTime(e) {
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const clickLeft = e.clientX;

    const clickPosition = (clickLeft - left) / width;
    return this.zoomStartTime + (this.zoomEndTime - this.zoomStartTime) * clickPosition;
  }

  onMissingRegions = regions => {
    log(`MissingRegions ${JSON.stringify(regions)}`);
  };

  onUnprocessedRegions = ({ regions }) => {
    log(`UnprocessedRegions ${JSON.stringify(regions)}`);
    this.props.setTimelineState({ unprocessedRegions: regions });
  };

  onConsoleUpdate = consoleState => {
    const {
      messages: { visibleMessages, messagesById },
    } = consoleState;

    if (visibleMessages != this.props.visibleMessages) {
      const messages = visibleMessages
        .map(id => messagesById.get(id))
        .filter(message => message.source == "console-api" || isError(message));

      this.props.setTimelineState({ messages, visibleMessages });
    }
  };

  // Called when hovering over a message in the console.
  onConsoleMessageHover = async (type, message) => {
    const { updateTooltip, highlightedMessage } = this.props;
    if (type == "mouseleave") {
      updateTooltip(null);
      return this.props.setTimelineState({ highlightedMessage: null });
    }

    if (type == "mouseenter") {
      const time = message.executionPointTime;
      const offset = this.getPixelOffset(time);
      updateTooltip({ left: offset });
      this.props.setTimelineState({ highlightedMessage: message.id });
      const { screen, mouse } = await getGraphicsAtTime(time);

      if (highlightedMessage === message.id) {
        updateTooltip({ screen, left: offset });
      }
    }

    return null;
  };

  findMessage(message) {
    const consoleOutput = this.console.hud.ui.outputNode;
    return consoleOutput.querySelector(`.message[data-message-id="${message.id}"]`);
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
    if (this.props.highlightedMessage) {
      this.props.setTimelineState({ highlightedMessage: null });
    }
  }

  showMessage(message) {
    this.scrollToMessage(message);
    this.previewLocation(message);
  }

  onMarkerMouseEnter() {
    this.setState({ hoveringOverMarker: true });
  }

  onMarkerMouseLeave() {
    this.setState({ hoveringOverMarker: false });
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

  hoverTimer = () => {
    const { updateTooltip } = this.props;
    const isHovered = window.elementIsHovered(this.$progressBar);
    if (!isHovered) {
      clearInterval(this.hoverInterval);
      updateTooltip(null);
    }
  };

  onPlayerMouseEnter = async e => {
    this.hoverInterval = setInterval(this.hoverTimer, 100);
  };

  onPlayerMouseMove = async e => {
    const { hoverTime, recordingDuration, updateTooltip } = this.props;
    if (!recordingDuration) {
      return;
    }

    const mouseTime = this.getMouseTime(e);
    const { point, time } = mostRecentPaintOrMouseEvent(mouseTime);

    if (hoverTime != time) {
      this.props.setTimelineState({ hoverTime: mouseTime });
      updateTooltip({ left: this.getPixelOffset(hoverTime) });

      const { screen, mouse } = await getGraphicsAtTime(time);
      if (hoverTime === mouseTime) {
        updateTooltip({ screen, left: this.getPixelOffset(hoverTime) });
      }
    }
  };

  onPlayerMouseLeave = () => {
    const { updateTooltip } = this.props;
    clearInterval(this.hoverInterval);

    this.unhighlightConsoleMessage();
    this.clearPreviewLocation();

    // Restore the normal graphics.

    updateTooltip(null);
    this.props.setTimelineState({ hoverTime: null, startDragTime: null });
  };

  onPlayerMouseDown = () => {
    const { hoverTime, setTimelineState } = this.props;
    if (hoverTime != null) {
      setTimelineState({ startDragTime: hoverTime });
    }
  };

  zoomedRegion() {
    const { startDragTime, hoverTime } = this.props;
    if (startDragTime == null || hoverTime == null) {
      return null;
    }
    const dragPos = this.getVisiblePosition(startDragTime);
    const hoverPos = this.getVisiblePosition(hoverTime);
    if (Math.abs(dragPos - hoverPos) < 0.02) {
      return null;
    }
    if (dragPos < hoverPos) {
      return { startTime: startDragTime, endTime: hoverTime };
    }
    return { startTime: hoverTime, endTime: startDragTime };
  }

  onPlayerMouseUp = e => {
    const {
      setZoomRegion,
      hoverTime,
      startDragTime,
      currentTime,
      hoveredMessage,
      hoveringOverMarker,
    } = this.props;
    const mouseTime = this.getMouseTime(e);

    this.props.setTimelineState({ startDragTime: null });

    const zoomRegion = this.zoomedRegion();
    if (zoomRegion) {
      setZoomRegion(zoomRegion);

      gToolbox.getWebconsoleWrapper().setZoomedRegion(zoomRegion.startTime, zoomRegion.endTime);

      if (currentTime < zoomRegion.startTime) {
        this.seekTime(zoomRegion.startTime);
      } else if (zoomRegion.endTime < currentTime) {
        this.seekTime(zoomRegion.endTime);
      }
    } else if (startDragTime != null && hoverTime != null && !hoveringOverMarker) {
      const { point, time } = mostRecentPaintOrMouseEvent(mouseTime);
      this.seek(point, mouseTime);
    }
  };

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

    const { point } = mostRecentPaintOrMouseEvent(targetTime);

    // Seek to the exact time provided, even if it does not match up with a
    // paint event. This can cause some slight UI weirdness: resumes done in
    // the debugger will be relative to the point instead of the time,
    // so e.g. running forward could land at a point before the time itself.
    // This could be fixed but doesn't seem worth worrying about for now.
    this.seek(point, targetTime);
  }

  doPrevious() {
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

  doNext() {
    const { currentTime, zoomEndTime } = this.props;
    if (currentTime == zoomEndTime) {
      return;
    }

    const next = nextPaintEvent(currentTime);
    if (!next) {
      return;
    }

    this.seekTime(Math.min(next.time, zoomEndTime));
  }

  nextPlaybackTime(time) {
    const { zoomEndTime } = this.props;

    if (time == zoomEndTime) {
      return null;
    }

    let nextEvent = nextPaintOrMouseEvent(time);

    // Skip over mouse events that are too close to the current time.
    while (nextEvent && nextEvent.clientX && nextEvent.time < time + 100) {
      nextEvent = nextPaintOrMouseEvent(nextEvent.time);
    }

    if (nextEvent && nextEvent.time < zoomEndTime) {
      return nextEvent.time;
    }

    return zoomEndTime;
  }

  playbackPaintFinished(time, screen, mouse) {
    if (this.props.playback && time == this.props.playback.time) {
      const { startTime, startDate } = this.props.playback;
      paintGraphics(screen, mouse);
      const next = this.nextPlaybackTime(time);
      if (next) {
        log(`PlaybackNext`);

        // For now we play back at 1x (or slower, while screens load).
        const paintTime = startDate + next - startTime;

        getGraphicsAtTime(next).then(({ screen, mouse }) => {
          const now = Date.now();
          setTimeout(() => {
            this.playbackPaintFinished(next, screen, mouse);
          }, Math.max(0, paintTime - now));
        });
        this.props.setTimelineState({
          playback: { time: next, startTime, startDate },
          currentTime: next,
        });
      } else {
        log(`StopPlayback`);
        this.seekTime(time);
        this.props.setTimelineState({ playback: null });
      }
    }
  }

  startPlayback() {
    log(`StartPlayback`);

    const startTime = this.props.currentTime;
    const startDate = Date.now();

    let time = this.nextPlaybackTime(this.props.currentTime);
    if (!time) {
      time = this.zoomStartTime;
    }
    getGraphicsAtTime(time).then(({ screen, mouse }) => {
      this.playbackPaintFinished(time, screen, mouse);
    });

    this.props.setTimelineState({
      playback: { time, startTime, startDate },
      currentTime: time,
    });
  }

  stopPlayback() {
    log(`StopPlayback`);

    if (this.props.playback) {
      this.seekTime(this.props.playback.time);
    }
    this.props.setTimelineState({ playback: null });
  }

  doZoomOut() {
    this.props.setZoomRegion({
      startTime: 0,
      endTime: this.props.recordingDuration,
    });
    gToolbox.getWebconsoleWrapper().setZoomedRegion(0, this.props.recordingDuration);
  }

  renderZoom() {
    const { recordingDuration } = this.props;
    const zoomed = this.zoomStartTime != 0 || this.zoomEndTime != recordingDuration;

    return CommandButton({
      className: "",
      active: zoomed,
      img: "zoomout",
      onClick: () => this.doZoomOut(),
    });
  }

  renderCommentButton() {
    if (!features.comments) {
      return null;
    }
    return CommandButton({
      className: "",
      active: true,
      img: "comment",
      onClick: this.props.startNewComment,
    });
  }

  // renderComment(comment, existingComments) {
  //   if (comment.time < this.zoomStartTime || comment.time > this.zoomEndTime || !comment.visible) {
  //     return;
  //   }
  //   const elem = ensureCommentElement(comment, {});
  //   const offset = this.getPixelOffset(comment.time);
  //   const bounds = elem.getBoundingClientRect();
  //   const { left, top } = pickCommentElementLocation(
  //     offset + this.overlayLeft - bounds.width / 2,
  //     this.overlayTop - bounds.height - 5,
  //     bounds,
  //     existingComments
  //   );
  //   elem.style.left = left;
  //   elem.style.top = top;
  // }

  // onCommentsUpdate(newComments) {
  //   const comments = [
  //     ...(newComments || [])
  //       .filter(comment => {
  //         // Ignore the comment for our own location.
  //         return comment.id != this.threadFront.sessionId;
  //       })
  //       .map(comment => {
  //         return { ...comment, visible: this.isServerCommentVisible(comment) };
  //       }),
  //     ...this.state.comments.filter(c => !c.saved),
  //   ];
  //   this.setState({ comments });
  //   removeOldCommentElements(comments);
  // }

  renderCommands() {
    const { playback } = this.props;

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
    this.overlayWidth = el ? el.clientWidth : 1;
    this.overlayTop = el ? el.getBoundingClientRect().top : 1;
    this.overlayLeft = el ? el.getBoundingClientRect().left : 1;
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
    const messageWidth = (markerWidth / this.overlayWidth) * 100;

    return Math.max(messagePosition - messageWidth / 2, 0);
  }

  renderMessage(message, index, visibleIndex) {
    const { messages, currentTime, pausedMessage, highlightedMessage } = this.props;

    const offset = this.getPixelOffset(message.executionPointTime);
    const previousVisibleMessage = messages[visibleIndex];

    if (offset < 0) {
      return null;
    }

    // Check to see if two messages overlay each other on the timeline
    const distance = this.getPixelDistance(
      message.executionPointTime,
      previousVisibleMessage?.executionPointTime
    );
    if (distance < 1) {
      return null;
    }

    const isOverlayed = distance < markerWidth;

    // Check to see if a message appears after the current execution point
    const isFuture =
      this.getPixelDistance(message.executionPointTime, currentTime) > markerWidth / 2;

    const isHighlighted = highlightedMessage == message.id;

    const atPausedLocation = pausedMessage && sameLocation(pausedMessage, message);

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
        left: `${this.getLeftOffset(message)}%`,
        zIndex: `${index + 100}`,
      },
      title: getFormatStr("jumpMessage2", frameLocation),
      onClick: e => {
        e.preventDefault();
        e.stopPropagation();
        const { executionPoint, executionPointTime, executionPointHasFrames } = message;
        this.seek(executionPoint, executionPointTime, executionPointHasFrames);
        this.showMessage(message);
      },
      onMouseEnter: () => this.onMarkerMouseEnter(),
      onMouseLeave: () => this.onMarkerMouseLeave(),
    });
  }

  renderMessages() {
    const messages = this.props.messages;
    let visibleIndex;

    return messages.map((message, index) => {
      const messageEl = this.renderMessage(message, index, visibleIndex);
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
    const widthPercent = (markerWidth / this.overlayWidth) * 100;
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

  renderHoverPoint() {
    const { hoverTime, hoveredMessage } = this.props;
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

  renderZoomedRegion() {
    const info = this.zoomedRegion();
    if (!info) {
      return [];
    }

    let startOffset = this.getPixelOffset(info.startTime);
    let endOffset = this.getPixelOffset(info.endTime);

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
    // const { comments } = this.state;
    // const existingComments = [];
    const percent = this.getVisiblePosition(this.props.currentTime) * 100;

    return div(
      {
        className: "replay-player",
      },
      div(
        {
          id: "overlay",
          className: classname("", { paused: true }),
        },
        div(
          {
            className: classname("overlay-container", {}),
          },
          div({ className: "commands" }, ...this.renderCommands()),
          div(
            {
              className: "progressBar",
              ref: a => (this.$progressBar = a),
              onMouseEnter: this.onPlayerMouseEnter,
              onMouseMove: this.onPlayerMouseMove,
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
            // ...this.renderCommentMarkers(),
            ...this.renderHoverPoint(),
            ...this.renderUnprocessedRegions(),
            ...this.renderZoomedRegion()
          ),
          this.renderZoom(),
          this.renderCommentButton()

          // ...comments.map(c => this.renderComment(c, existingComments))
        )
      )
    );
  }
}

export default connect(
  state => ({
    zoomRegion: selectors.getZoomRegion(state),
    currentTime: selectors.getCurrentTime(state),
    hoverTime: selectors.getHoverTime(state),
    startDragTime: selectors.getStartDragTime(state),
    playback: selectors.getPlayback(state),
    messages: selectors.getMessages(state),
    highlightedMessage: selectors.getHighlightedMessage(state),
    hoveredMessage: selectors.getHoveredMessage(state),
    unprocessedRegions: selectors.getUnprocessedRegions(state),
    recordingDuration: selectors.getRecordingDuration(state),
  }),
  {
    updateTooltip: actions.updateTooltip,
    setZoomRegion: actions.setZoomRegion,
    setTimelineState: actions.setTimelineState,
    createComment: actions.createComment,
  }
)(Timeline);
