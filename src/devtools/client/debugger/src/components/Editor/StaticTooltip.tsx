import React from "react";
import ReactDOM from "react-dom";

type StaticTooltipProps = {
  targetNode: HTMLElement;
  children: JSX.Element | string;
  className?: string;
};

export default function StaticTooltip({ targetNode, children }: StaticTooltipProps) {
  return ReactDOM.createPortal(
    <div className="absolute z-50 flex flex-row space-x-px transform -right-1 translate-x-full bottom-4 mb-0.5 pointer-events-none">
      {children}
    </div>,
    targetNode
  );
}
