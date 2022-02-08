import React from "react";
import ReactDOM from "react-dom";

type StaticTooltipProps = {
  targetNode: HTMLElement;
  children: JSX.Element | string;
  className?: string;
};

export default function StaticTooltip({ targetNode, children, className }: StaticTooltipProps) {
  const { top, left } = targetNode.getBoundingClientRect();
  let style = { top: `${top}px`, left: `${left}px` };

  return ReactDOM.createPortal(
    <div className={`static-tooltip z-10 ml-1 -mt-1 text-sm ${className}`} style={style}>
      <div className="-translate-y-full transform">{children}</div>
    </div>,
    document.body
  );
}
