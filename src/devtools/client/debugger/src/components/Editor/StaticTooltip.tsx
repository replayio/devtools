import React, { useRef, useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { connect, ConnectedProps } from "react-redux";
import { UIState } from "ui/state";
import { getPaneCollapse } from "../../selectors";

type StaticTooltipProps = PropsFromRedux & {
  targetNode: HTMLElement;
  children: JSX.Element | string;
  className?: string;
};

function StaticTooltip({
  targetNode,
  children,
  className,
  startPanelCollapsed,
}: StaticTooltipProps) {
  const { top, left, right } = targetNode.getBoundingClientRect();
  const docWidth = document.querySelector("html")!.getBoundingClientRect().width;

  let style = { top: `${top}px`, left: `${right}px` };

  return ReactDOM.createPortal(
    <div className={`static-tooltip text-sm z-10 ml-1 -mt-7 ${className}`} style={style}>
      {children}
    </div>,
    document.body
  );
}

const connector = connect((state: UIState) => ({ startPanelCollapsed: getPaneCollapse(state) }));
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(StaticTooltip);
