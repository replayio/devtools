/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from "react";

interface DraggableProps {
  onMove: (x: number, y: number) => void;
  onStart: () => void;
  onStop: () => void;
  style: React.CSSProperties;
  className: string;
}

class Draggable extends React.Component<DraggableProps> {
  isDragging = false;

  draggableEl = React.createRef<HTMLDivElement>();

  startDragging = (ev: React.MouseEvent) => {
    if (this.isDragging) {
      return;
    }
    this.isDragging = true;

    ev.preventDefault();
    const doc = this.draggableEl.current!.ownerDocument;
    doc.addEventListener("mousemove", this.onMove);
    doc.addEventListener("mouseup", this.onUp);
    this.props.onStart && this.props.onStart();
  };

  onMove = (ev: MouseEvent) => {
    if (!this.isDragging) {
      return;
    }

    ev.preventDefault();
    // Use viewport coordinates so, moving mouse over iframes
    // doesn't mangle (relative) coordinates.
    this.props.onMove(ev.clientX, ev.clientY);
  };

  onUp = (ev: MouseEvent) => {
    if (!this.isDragging) {
      return;
    }
    this.isDragging = false;

    ev.preventDefault();
    const doc = this.draggableEl.current!.ownerDocument;
    doc.removeEventListener("mousemove", this.onMove);
    doc.removeEventListener("mouseup", this.onUp);
    this.props.onStop && this.props.onStop();
  };

  render() {
    return (
      <div
        ref={this.draggableEl}
        role="presentation"
        style={this.props.style}
        className={this.props.className}
        onMouseDown={this.startDragging}
      />
    );
  }
}

module.exports = Draggable;
