/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import classNames from "classnames";
import React, { Component } from "react";
import ReactDOM from "react-dom";

import BracketArrow from "./BracketArrow";
import SmartGap from "./SmartGap";

class Popover extends Component {
  $popover;
  $tooltip;
  $gap;
  timerId;
  wasOnGap;
  state = {
    coords: {
      left: 0,
      orientation: "down",
      targetMid: { x: 0, y: 0 },
      top: 0,
    },
  };
  firstRender = true;
  gapHeight;
  gapHeight;

  static defaultProps = {
    type: "popover",
  };

  componentDidMount() {
    const { type } = this.props;
    // $FlowIgnore
    this.gapHeight = this.$gap.getBoundingClientRect().height;
    const coords = type == "popover" ? this.getPopoverCoords() : this.getTooltipCoords();

    if (coords) {
      this.setState({ coords });
    }

    this.firstRender = false;
    this.startTimer();
  }

  componentWillUnmount() {
    if (this.timerId) {
      clearTimeout(this.timerId);
    }
  }

  startTimer() {
    this.timerId = setTimeout(this.onTimeout, 0);
  }

  onTimeout = () => {
    const isHoveredOnGap = this.$gap && this.$gap.matches(":hover");
    const isHoveredOnPopover =
      this.$popoverPreview && window.elementIsHovered(this.$popoverPreview);
    const isHoveredOnTooltip = this.$tooltip && window.elementIsHovered(this.$tooltip);
    const isHoveredOnTarget = window.elementIsHovered(this.props.target);

    if (isHoveredOnGap) {
      if (!this.wasOnGap) {
        this.wasOnGap = true;
        this.timerId = setTimeout(this.onTimeout, 200);
        return;
      }
      this.props.mouseout();
      return;
    }

    // Don't clear the current preview if mouse is hovered on
    // the current preview's token (target) or the popup element
    if (isHoveredOnPopover || isHoveredOnTooltip || isHoveredOnTarget) {
      this.wasOnGap = false;
      this.timerId = setTimeout(this.onTimeout, 0);
      return;
    }

    this.props.mouseout();
  };

  calculateLeft(target, editor, popover, orientation) {
    const estimatedLeft = target.left;
    const estimatedRight = estimatedLeft + popover.width;
    const isOverflowingRight = estimatedRight > editor.right;
    if (orientation === "right") {
      return target.left + target.width;
    }
    if (isOverflowingRight) {
      const adjustedLeft = editor.right - popover.width - 8;
      return adjustedLeft;
    }
    return estimatedLeft;
  }

  calculateTopForRightOrientation = (target, editor, popover) => {
    if (popover.height <= editor.height) {
      const rightOrientationTop = target.top - popover.height / 2;
      if (rightOrientationTop < editor.top) {
        return editor.top - target.height;
      }
      const rightOrientationBottom = rightOrientationTop + popover.height;
      if (rightOrientationBottom > editor.bottom) {
        return editor.bottom + target.height - popover.height + this.gapHeight;
      }
      return rightOrientationTop;
    }
    return editor.top - target.height;
  };

  calculateOrientation(target, editor, popover) {
    const estimatedBottom = target.bottom + popover.height;
    if (editor.bottom > estimatedBottom) {
      return "down";
    }
    const upOrientationTop = target.top - popover.height;
    if (upOrientationTop > editor.top) {
      return "up";
    }

    return "right";
  }

  calculateTop = (target, editor, popover, orientation) => {
    if (orientation === "down") {
      return target.bottom;
    }
    if (orientation === "up") {
      return target.top - popover.height;
    }

    return this.calculateTopForRightOrientation(target, editor, popover);
  };

  getPopoverCoords() {
    if (!this.$popover || !this.props.editorRef) {
      return null;
    }

    const popover = this.$popover;
    const editor = this.props.editorRef;
    const popoverRect = popover.getBoundingClientRect();
    const editorRect = editor.getBoundingClientRect();
    const targetRect = this.props.targetPosition;
    const orientation = this.calculateOrientation(targetRect, editorRect, popoverRect);
    const top = this.calculateTop(targetRect, editorRect, popoverRect, orientation);
    const popoverLeft = this.calculateLeft(targetRect, editorRect, popoverRect, orientation);
    let targetMid;
    if (orientation === "right") {
      targetMid = {
        x: -14,
        y: targetRect.top - top - 2,
      };
    } else {
      targetMid = {
        x: targetRect.left - popoverLeft + targetRect.width / 2 - 8,
        y: 0,
      };
    }

    return {
      left: popoverLeft,
      orientation,
      targetMid,
      top,
    };
  }

  getTooltipCoords() {
    if (!this.$tooltip || !this.props.editorRef) {
      return null;
    }
    const tooltip = this.$tooltip;
    const editor = this.props.editorRef;
    const tooltipRect = tooltip.getBoundingClientRect();
    const editorRect = editor.getBoundingClientRect();
    const targetRect = this.props.targetPosition;
    const left = this.calculateLeft(targetRect, editorRect, tooltipRect);
    const enoughRoomForTooltipAbove = targetRect.top - editorRect.top > tooltipRect.height;
    const top = enoughRoomForTooltipAbove ? targetRect.top - tooltipRect.height : targetRect.bottom;

    return {
      left,
      orientation: enoughRoomForTooltipAbove ? "up" : "down",
      targetMid: { x: 0, y: 0 },
      top,
    };
  }

  getChildren() {
    const { children } = this.props;
    const coords = this.state.coords;
    const gap = this.getGap();

    return coords.orientation === "up" ? [children, gap] : [gap, children];
  }

  getGap() {
    if (this.firstRender) {
      return <div className="gap" key="gap" ref={a => (this.$gap = a)} />;
    }

    return (
      <div className="gap" key="gap" ref={a => (this.$gap = a)}>
        <SmartGap
          token={this.props.target}
          preview={this.$tooltip || this.$popover}
          type={this.props.type}
          gapHeight={this.gapHeight}
          coords={this.state.coords}
          // $FlowIgnore
          offset={this.$gap.getBoundingClientRect().left}
        />
      </div>
    );
  }

  getPopoverArrow(orientation, left, top) {
    let arrowProps = {};

    if (orientation === "up") {
      arrowProps = { bottom: 10, left, orientation: "down" };
    } else if (orientation === "down") {
      arrowProps = { left, orientation: "up", top: -2 };
    } else {
      arrowProps = { left: -4, orientation: "left", top };
    }

    return <BracketArrow {...arrowProps} />;
  }

  renderPopover() {
    const { top, left, orientation, targetMid } = this.state.coords;
    const arrow = this.getPopoverArrow(orientation, targetMid.x, targetMid.y);

    return (
      <div
        className={classNames("popover", `orientation-${orientation}`, {
          up: orientation === "up",
        })}
        style={{ left, top }}
        ref={c => {
          this.$popover = c;
          this.$popoverPreview = c && c.querySelector(".preview-popup");
        }}
      >
        {arrow}
        {this.getChildren()}
      </div>
    );
  }

  renderTooltip() {
    const { top, left, orientation } = this.state.coords;
    return (
      <div
        className={classNames("tooltip", `orientation-${orientation}`)}
        style={{ left, top, zIndex: 20 }}
        ref={c => (this.$tooltip = c)}
      >
        {this.getChildren()}
      </div>
    );
  }

  render() {
    const { type } = this.props;

    return ReactDOM.createPortal(
      type === "tooltip" ? this.renderTooltip() : this.renderPopover(),
      document.body
    );
  }
}

export default Popover;
