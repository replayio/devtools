import classNames from "classnames";
import React from "react";
import ReactDOM from "react-dom";
import { useFeature } from "ui/hooks/settings";

type StaticTooltipProps = {
  targetNode: HTMLElement;
  children: JSX.Element | string;
  className?: string;
};

export default function StaticTooltip({ targetNode, children }: StaticTooltipProps) {
  const { value: enableLargeText } = useFeature("enableLargeText");

  return ReactDOM.createPortal(
    <div
      className={classNames(
        "pointer-events-none absolute -right-1 bottom-4 z-50 mb-0.5 flex translate-x-full transform flex-row space-x-px",
        enableLargeText && "bottom-6"
      )}
    >
      {children}
    </div>,
    targetNode
  );
}
