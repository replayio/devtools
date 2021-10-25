import React, { ReactNode, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./PortalDropdown.css";

export interface TargetCoordinates {
  x: number;
  y: number;
}

interface PortalTooltipProps {
  tooltip: ReactNode;
  children: ReactNode;
}

export default function PortalTooltip({ children, tooltip }: PortalTooltipProps) {
  const [hoveredCoordinates, setHoveredCoordinates] = useState<TargetCoordinates | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onMouseMove = (e: React.MouseEvent) => {
    setHoveredCoordinates({ x: e.clientX, y: e.clientY });
  };
  const onMouseLeave = (e: React.MouseEvent) => {
    setHoveredCoordinates(null);
  };

  return (
    <>
      <div
        className="w-full h-full"
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        ref={containerRef}
      >
        {children}
      </div>
      {hoveredCoordinates && containerRef.current
        ? createPortal(
            <div
              className="transform -translate-x-1/2 -translate-y-full absolute z-10 animate"
              style={{
                left: hoveredCoordinates.x,
                top: containerRef.current.getBoundingClientRect().y,
              }}
            >
              {tooltip}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
