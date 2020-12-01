import React, { CSSProperties, PureComponent } from "react";
import { createPortal } from "react-dom";
import { DropdownProps } from "./Dropdown";
import "./PortalDropdown.css";

interface PortalDropdownProps extends DropdownProps {
  distance?: number;
}

export default class PortalDropdown extends PureComponent<PortalDropdownProps> {
  private buttonRef = React.createRef<HTMLButtonElement>();

  getContentPosition(): CSSProperties {
    if (this.props.expanded && this.buttonRef.current) {
      const { left, right, top, bottom } = this.buttonRef.current.getBoundingClientRect();
      const { width, height } = document.body.getBoundingClientRect();
      const distance = this.props.distance || 5;

      switch (this.props.position) {
        case "top-right":
          return { bottom: height - top + distance + "px", left: left + "px" };
        case "bottom-right":
          return { top: bottom + distance + "px", left: left + "px" };
        case "top-left":
          return { bottom: height - top + distance + "px", right: width - right + "px" };
        case "bottom-left":
          return { top: bottom + distance + "px", right: width - right + "px" };
      }
    }

    return {};
  }

  expand = () => {
    this.props.setExpanded(true);
  };

  collapse = () => {
    this.props.setExpanded(false);
  };

  render() {
    const {
      buttonContent,
      children,
      position = "bottom-left",
      buttonStyle = "primary",
      style,
      expanded,
    } = this.props;

    const contentPosition = this.getContentPosition();

    return (
      <div className="portal-dropdown-wrapper">
        <button
          className={`expand-dropdown ${buttonStyle}`}
          onClick={this.expand}
          ref={this.buttonRef}
        >
          {buttonContent}
        </button>
        {expanded
          ? createPortal(
              <div className="portal-dropdown-container">
                <div className="mask" onClick={this.collapse} />
                <div className={`content ${position}`} style={{ ...style, ...contentPosition }}>
                  {children}
                </div>
              </div>,
              document.body
            )
          : null}
      </div>
    );
  }
}
