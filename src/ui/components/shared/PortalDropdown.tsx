import React, { CSSProperties, RefObject, useRef } from "react";
import { createPortal } from "react-dom";
import { DropdownProps } from "./Dropdown";
import "./PortalDropdown.css";

interface PortalDropdownProps extends DropdownProps {
  distance?: number;
}

export default function PortalDropdown(props: PortalDropdownProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const expand = () => {
    props.setExpanded(true);
  };

  const collapse = () => {
    props.setExpanded(false);
  };

  const {
    buttonContent,
    children,
    position = "bottom-left",
    buttonStyle = "primary",
    style,
    expanded,
  } = props;

  const contentPosition = getContentPosition(props, buttonRef);

  return (
    <div className="portal-dropdown-wrapper">
      <button className={`expand-dropdown ${buttonStyle}`} onClick={expand} ref={buttonRef}>
        {buttonContent}
      </button>
      {expanded
        ? createPortal(
            <div className="portal-dropdown-container">
              <div className="mask" onClick={collapse} />
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

function getContentPosition(
  props: PortalDropdownProps,
  buttonRef: RefObject<HTMLButtonElement>
): CSSProperties {
  if (props.expanded && buttonRef.current) {
    const { left, right, top, bottom } = buttonRef.current.getBoundingClientRect();
    const { width, height } = document.body.getBoundingClientRect();
    const distance = props.distance || 5;

    switch (props.position) {
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
