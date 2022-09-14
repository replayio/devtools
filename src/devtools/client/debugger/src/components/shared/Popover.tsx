/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import React, { Component } from "react";
import ReactDOM from "react-dom";

import classNames from "classnames";
import BracketArrow from "./BracketArrow";
import type { BracketArrowOrientation, BAProps } from "./BracketArrow";
import SmartGap from "./SmartGap";

interface PopoverProps {
  type: "tooltip" | "popover";
  editorRef: any;
  target: HTMLElement;
  targetPosition: DOMRect;
  mouseout: () => void;
  children?: React.ReactNode;
}

interface PopoverCoords {
  left: number;
  top: number;
  orientation: BracketArrowOrientation;
  targetMid: { x: number; y: number };
}

interface PopoverState {
  coords: PopoverCoords | null;
}

class Popover extends Component<PopoverProps, PopoverState> {
  $popover: HTMLDivElement | null = null;
  $popoverPreview: HTMLDivElement | null = null;
  $tooltip: HTMLDivElement | null = null;
  $gap: HTMLElement | null = null;
  timerId: ReturnType<typeof window.setTimeout> | null = null;
  wasOnGap: boolean = false;
  state = {
    coords: {
      left: 0,
      top: 0,
      orientation: "down",
      targetMid: { x: 0, y: 0 },
    } as PopoverCoords,
  };
  firstRender = true;
  gapHeight: number = 0;

  static defaultProps = {
    type: "popover",
  };

  componentDidMount() {
    const { type } = this.props;
    this.gapHeight = this.$gap!.getBoundingClientRect().height;
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

  calculateLeft(
    target: DOMRect,
    editor: DOMRect,
    popover: DOMRect,
    orientation?: BracketArrowOrientation
  ) {
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

  calculateTopForRightOrientation = (target: DOMRect, editor: DOMRect, popover: DOMRect) => {
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

  calculateOrientation(target: DOMRect, editor: DOMRect, popover: DOMRect) {
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

  calculateTop = (
    target: DOMRect,
    editor: DOMRect,
    popover: DOMRect,
    orientation: BracketArrowOrientation
  ) => {
    if (orientation === "down") {
      return target.bottom;
    }
    if (orientation === "up") {
      return target.top - popover.height;
    }

    return this.calculateTopForRightOrientation(target, editor, popover);
  };

  getPopoverCoords(): PopoverCoords | null {
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
      top,
      orientation,
      targetMid,
    };
  }

  getTooltipCoords(): PopoverCoords | null {
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
      top,
      orientation: enoughRoomForTooltipAbove ? "up" : "down",
      targetMid: { x: 0, y: 0 },
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
          offset={this.$gap!.getBoundingClientRect().left}
        />
      </div>
    );
  }

  getPopoverArrow(orientation: BracketArrowOrientation, left: number, top: number) {
    let arrowProps = {} as React.ComponentProps<typeof BracketArrow>;

    if (orientation === "up") {
      arrowProps = { orientation: "down", bottom: 10, left };
    } else if (orientation === "down") {
      arrowProps = { orientation: "up", top: -2, left };
    } else {
      arrowProps = { orientation: "left", top, left: -4 };
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
        style={{ top, left }}
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
        style={{ top, left, zIndex: 20 }}
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
