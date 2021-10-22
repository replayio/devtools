import classNames from "classnames";
import React from "react";
import { createPortal } from "react-dom";
import { DropdownProps } from "./Dropdown";
import "./PortalDropdown.css";

export interface TargetCoordinates {
  x: number;
  y: number;
}

interface PortalDropdownProps extends DropdownProps {
  targetCoordinates: TargetCoordinates;
  classnames: string;
  targetElement: HTMLDivElement;
}

export default function PortalTooltip({
  targetCoordinates,
  children,
  classnames,
  targetElement,
}: PortalDropdownProps) {
  const { x } = targetCoordinates;
  const { y } = targetElement.getBoundingClientRect();

  return createPortal(
    <div
      className={classNames(
        "transform -translate-x-1/2 -translate-y-full absolute z-10 animate",
        classnames
      )}
      style={{ left: x, top: y }}
    >
      {children}
    </div>,
    document.body
  );
}
