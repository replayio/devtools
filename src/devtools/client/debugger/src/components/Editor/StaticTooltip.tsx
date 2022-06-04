import React from "react";
import ReactDOM from "react-dom";
import { useFeature } from "ui/hooks/settings";
import classNames from "classnames";

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
        "absolute z-50 flex flex-row space-x-px transform -right-1 translate-x-full bottom-4 mb-0.5 pointer-events-none",
        enableLargeText && "bottom-6"
      )}
    >
      {children}
    </div>,
    targetNode
  );
}
