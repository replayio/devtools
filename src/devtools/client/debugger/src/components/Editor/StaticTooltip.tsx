import React from "react";
import ReactDOM from "react-dom";

type StaticTooltipProps = {
  targetNode: HTMLElement;
  children: JSX.Element | string;
  className?: string;
};

export default function StaticTooltip({ targetNode, children }: StaticTooltipProps) {
  return ReactDOM.createPortal(
    <div
      className="pointer-events-none absolute -right-1 bottom-4 z-50 mb-0.5 flex translate-x-full transform flex-row space-x-px"
      style={{ zIndex: 1500 }}
    >
      {children}
    </div>,
    targetNode
  );
}
