/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const PropTypes = require("prop-types");
const { createRef, Component } = require("react");
const dom = require("react-dom-factories");

class Draggable extends Component {
  static get propTypes() {
    return {
      className: PropTypes.string,
      onMove: PropTypes.func.isRequired,
      onStart: PropTypes.func,
      onStop: PropTypes.func,
      style: PropTypes.object,
    };
  }

  constructor(props) {
    super(props);

    this.draggableEl = createRef();

    this.startDragging = this.startDragging.bind(this);
    this.onMove = this.onMove.bind(this);
    this.onUp = this.onUp.bind(this);
  }

  startDragging(ev) {
    if (this.isDragging) {
      return;
    }
    this.isDragging = true;

    ev.preventDefault();
    const doc = this.draggableEl.current.ownerDocument;
    doc.addEventListener("mousemove", this.onMove);
    doc.addEventListener("mouseup", this.onUp);
    this.props.onStart && this.props.onStart();
  }

  onMove(ev) {
    if (!this.isDragging) {
      return;
    }

    ev.preventDefault();
    // Use viewport coordinates so, moving mouse over iframes
    // doesn't mangle (relative) coordinates.
    this.props.onMove(ev.clientX, ev.clientY);
  }

  onUp(ev) {
    if (!this.isDragging) {
      return;
    }
    this.isDragging = false;

    ev.preventDefault();
    const doc = this.draggableEl.current.ownerDocument;
    doc.removeEventListener("mousemove", this.onMove);
    doc.removeEventListener("mouseup", this.onUp);
    this.props.onStop && this.props.onStop();
  }

  render() {
    return dom.div({
      className: this.props.className,
      onMouseDown: this.startDragging,
      ref: this.draggableEl,
      role: "presentation",
      style: this.props.style,
    });
  }
}

module.exports = Draggable;
