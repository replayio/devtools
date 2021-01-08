import React, { CSSProperties, RefObject, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { DropdownProps } from "./Dropdown";
import "./PortalDropdown.css";

interface PortalDropdownProps extends DropdownProps {
  distance?: number;
  style?: CSSProperties;
}

type Direction = "top" | "bottom";
type Position = "top-right" | "bottom-right" | "top-left" | "bottom-left";

type ViewportOverflows = Direction[];

export default function PortalDropdown(props: PortalDropdownProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownNode, setDropdownNode] = useState<HTMLDivElement | null>(null);
  const dropdownRef = useCallback(
    node => {
      if (node !== null) {
        console.log(setDropdownNode);
        setDropdownNode(node);
      }
    },
    [props.expanded]
  );

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

  const contentPosition = getContentPosition(props, buttonRef, dropdownNode);

  return (
    <div className="portal-dropdown-wrapper">
      <button className={`expand-dropdown ${buttonStyle}`} onClick={expand} ref={buttonRef}>
        {buttonContent}
      </button>
      {expanded
        ? createPortal(
            <div className="portal-dropdown-container">
              <div className="mask" onClick={collapse} />
              <div
                className={`content ${position}`}
                style={{ ...style, ...contentPosition }}
                ref={dropdownRef}
              >
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
  buttonRef: RefObject<HTMLButtonElement>,
  dropdownNode: HTMLDivElement | null
): CSSProperties {
  if (props.expanded && buttonRef.current) {
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const docRect = document.body.getBoundingClientRect();
    const dropdownRect = dropdownNode?.getBoundingClientRect();

    const { left, right, top, bottom } = buttonRect;
    const { width: docWidth, height: docHeight } = docRect;
    const distance = props.distance || 5;

    let position = props.position || "bottom-left";
    let viewportOverflows = getViewportOverflows(docRect, dropdownRect);

    viewportOverflows.forEach(overflow => {
      if (position.includes(overflow)) {
        position = adjustPosition(position, overflow);
      }
    });

    switch (position) {
      case "top-right":
        return { bottom: docHeight - top + distance + "px", left: left + "px" };
      case "bottom-right":
        return { top: bottom + distance + "px", left: left + "px" };
      case "top-left":
        return { bottom: docHeight - top + distance + "px", right: docWidth - right + "px" };
      case "bottom-left":
        return { top: bottom + distance + "px", right: docWidth - right + "px" };
    }
  }

  return {};
}

function getViewportOverflows(doc: ClientRect, dropdown?: ClientRect): ViewportOverflows {
  const overflows: ViewportOverflows = [];

  if (!dropdown) {
    return [];
  }

  if (doc.bottom < dropdown.bottom) {
    overflows.push("bottom");
  }

  if (doc.top > dropdown.top) {
    overflows.push("top");
  }

  return overflows;
}

function adjustPosition(position: Position, overflow: Direction) {
  const oppositeMap = { top: "bottom", bottom: "top" };

  return position.replace(overflow, oppositeMap[overflow]) as Position;
}
