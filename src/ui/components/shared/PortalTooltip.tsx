import classNames from "classnames";
import React, { ReactNode } from "react";
import { createPortal } from "react-dom";
import "./PortalDropdown.css";

export interface TargetCoordinates {
  x: number;
  y: number;
}

interface PortalTooltipProps {
  targetCoordinates: TargetCoordinates;
  targetElement: HTMLDivElement;
  children: ReactNode;
}

export default function PortalTooltip({
  targetCoordinates,
  children,
  targetElement,
}: PortalTooltipProps) {
  const { x } = targetCoordinates;
  const { y } = targetElement.getBoundingClientRect();

  return createPortal(
    <div
      className="transform -translate-x-1/2 -translate-y-full absolute z-10 animate"
      style={{ left: x, top: y }}
    >
      {children}
    </div>,
    document.body
  );
}
