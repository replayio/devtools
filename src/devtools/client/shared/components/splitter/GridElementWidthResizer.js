/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const Draggable = require("devtools/client/shared/components/splitter/Draggable");
const PropTypes = require("prop-types");
const React = require("react");

class GridElementWidthResizer extends React.Component {
  static get propTypes() {
    return {
      className: PropTypes.string,
      enabled: PropTypes.bool,
      getControlledElementNode: PropTypes.func.isRequired,
      onResizeEnd: PropTypes.func,
      position: PropTypes.string.isRequired,
    };
  }

  constructor(props) {
    super(props);

    this.onStartMove = this.onStartMove.bind(this);
    this.onStopMove = this.onStopMove.bind(this);
    this.onMove = this.onMove.bind(this);
    this.state = {
      defaultCursor: null,
      defaultWidth: null,
      dragging: false,
      isRTLElement: false,
    };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.enabled === true && this.props.enabled === false) {
      this.onStopMove();
      const controlledElementNode = this.props.getControlledElementNode();
      controlledElementNode.style.width = this.state.defaultWidth;
    }
  }

  // Dragging Events

  /**
   * Set 'resizing' cursor on entire document during splitter dragging.
   * This avoids cursor-flickering that happens when the mouse leaves
   * the splitter bar area (happens frequently).
   */
  onStartMove() {
    const controlledElementNode = this.props.getControlledElementNode();
    if (!controlledElementNode) {
      return;
    }

    const doc = controlledElementNode.ownerDocument;
    const defaultCursor = doc.documentElement.style.cursor;
    const defaultWidth = doc.documentElement.style.width;
    doc.documentElement.style.cursor = "ew-resize";
    doc.firstElementChild.classList.add("dragging");

    this.setState({
      defaultCursor,
      defaultWidth,
      dragging: true,
      isRTLElement:
        controlledElementNode.ownerDocument.defaultView.getComputedStyle(controlledElementNode)
          .direction === "rtl",
    });
  }

  onStopMove() {
    const controlledElementNode = this.props.getControlledElementNode();
    if (!this.state.dragging || !controlledElementNode) {
      return;
    }
    const doc = controlledElementNode.ownerDocument;
    doc.documentElement.style.cursor = this.state.defaultCursor;
    doc.firstElementChild.classList.remove("dragging");

    this.setState({
      dragging: false,
    });

    if (this.props.onResizeEnd) {
      const { width } = controlledElementNode.getBoundingClientRect();
      this.props.onResizeEnd(width);
    }
  }

  /**
   * Adjust size of the controlled panel.
   */
  onMove(x) {
    const controlledElementNode = this.props.getControlledElementNode();
    if (!this.state.dragging || !controlledElementNode) {
      return;
    }
    const nodeBounds = controlledElementNode.getBoundingClientRect();
    const { isRTLElement } = this.state;
    const { position } = this.props;

    const size =
      (isRTLElement && position === "end") || (!isRTLElement && position === "start")
        ? nodeBounds.width + (nodeBounds.left - x)
        : x - nodeBounds.left;

    controlledElementNode.style.width = `${size}px`;
  }

  render() {
    if (!this.props.enabled) {
      return null;
    }

    const classNames = ["grid-element-width-resizer", this.props.position];
    if (this.props.className) {
      classNames.push(this.props.className);
    }

    return React.createElement(Draggable, {
      className: classNames.join(" "),
      onMove: this.onMove,
      onStart: this.onStartMove,
      onStop: this.onStopMove,
    });
  }
}

module.exports = GridElementWidthResizer;
