import React from "react";
import ReactDOM from "react-dom";

type StaticTooltipProps = {
  targetNode: HTMLElement;
  children: JSX.Element | string;
  className?: string;
};

const GUTTER_HEIGHT = 15;
const BUTTON_HEIGHT = 18;

export default function StaticTooltip({ targetNode, children, className }: StaticTooltipProps) {
  const { top, right } = targetNode.getBoundingClientRect();
  let style = { top: `${top + (GUTTER_HEIGHT - BUTTON_HEIGHT) / 2}px`, left: `${right}px` };

  console.log(targetNode)

  return ReactDOM.createPortal(
    <div className={`static-tooltip z-10 ml-1 -mt-1 text-sm ${className}`} style={style}>
      <div className="-translate-y-full transform">{children}</div>
    </div>,
    document.body
  );
}
