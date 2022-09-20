import classNames from "classnames";
import React from "react";
import ReactDOM from "react-dom";
import { useFeature, useStringPref } from "ui/hooks/settings";

type StaticTooltipProps = {
  targetNode: HTMLElement;
  children: JSX.Element | string;
  className?: string;
};

export default function StaticTooltip({ targetNode, children }: StaticTooltipProps) {
  const { value: enableLargeText } = useFeature("enableLargeText");
  const { value: hitCountsMode } = useStringPref("hitCounts");

  return ReactDOM.createPortal(
    <div
      className={classNames(
        "pointer-events-none absolute bottom-4 z-50 mb-0.5 flex translate-x-full transform flex-row space-x-px",
        enableLargeText && "bottom-6",
        hitCountsMode === "show-counts" ? "-right-[20px]" : "-right-[10px]"
      )}
      style={{
        right:
          hitCountsMode === "show-counts"
            ? "calc(var(--hit-count-gutter-width) - 6px)"
            : hitCountsMode === "hide-counts"
            ? "-10px"
            : "0px",
      }}
    >
      {children}
    </div>,
    targetNode
  );
}
