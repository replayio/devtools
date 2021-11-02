import React, { ReactNode, useRef, useState } from "react";
import { createPortal } from "react-dom";
// import "./PortalDropdown.css";

export interface TargetCoordinates {
  x: number;
  y: number;
}

interface PortalTooltipProps {
  tooltip: ReactNode;
  children: ReactNode;
  followX?: boolean;
}

export default function PortalTooltip({ children, tooltip, followX = false }: PortalTooltipProps) {
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
        className="w-full h-full leading-3"
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        ref={containerRef}
      >
        {children}
      </div>
      {hoveredCoordinates && containerRef.current
        ? createPortal(
            <PortalChild
              hoveredCoordinates={hoveredCoordinates}
              containerRect={containerRef.current.getBoundingClientRect()}
              followX={followX}
            >
              {tooltip}
            </PortalChild>,
            document.body
          )
        : null}
    </>
  );
}

function PortalChild({
  hoveredCoordinates,
  containerRect,
  followX,
  children,
}: {
  hoveredCoordinates: TargetCoordinates;
  containerRect: DOMRect;
  followX: boolean;
  children: ReactNode;
}) {
  const hoveredX = hoveredCoordinates.x;
  const targetX = containerRect.x;

  return (
    <div
      className="transform -translate-x-1/2 -translate-y-full absolute z-50 animate"
      style={{
        left: followX ? hoveredX : targetX,
        top: containerRect.y,
      }}
    >
      {children}
    </div>
  );
}
