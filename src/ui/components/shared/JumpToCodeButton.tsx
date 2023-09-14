import { ExecutionPoint } from "@replayio/protocol";
import classnames from "classnames";
import React, { useState } from "react";

import Icon from "replay-next/components/Icon";
import { isExecutionPointsGreaterThan } from "replay-next/src/utils/time";

export type JumpToCodeFailureReason = "not_focused" | "no_hits";
export type JumpToCodeStatus = JumpToCodeFailureReason | "not_checked" | "loading" | "found";

export const errorMessages: Record<JumpToCodeFailureReason, string> = {
  not_focused: "Not focused",
  no_hits: "No results",
};

interface JumpToCodeButtonProps {
  currentExecutionPoint: ExecutionPoint | null;
  disabled?: boolean;
  onClick: () => void;
  status: JumpToCodeStatus;
  targetExecutionPoint: ExecutionPoint;
  className?: string;
}

export function JumpToCodeButton({
  currentExecutionPoint,
  disabled = false,
  onClick,
  status,
  targetExecutionPoint,
  className = "",
}: JumpToCodeButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const jumpToCodeButtonAvailable = status === "not_checked" || status === "found";

  const jumpToCodeButtonClassname = classnames(
    `transition-width flex items-center justify-center rounded-full  duration-100 ease-out h-6 ${className}`,
    {
      "bg-primaryAccent cursor-pointer cursor-default": jumpToCodeButtonAvailable,
      "bg-gray-400 ": !jumpToCodeButtonAvailable,
      "px-2 shadow-sm": isHovered,
      "w-6": !isHovered,
      "opacity-5": disabled,
    }
  );

  const onJumpButtonMouseEnter = (e: React.MouseEvent) => {
    setIsHovered(true);
  };

  const onJumpButtonMouseLeave = (e: React.MouseEvent) => {
    setIsHovered(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (jumpToCodeButtonAvailable) {
      onClick();
    }
  };

  const timeLabel =
    currentExecutionPoint === null ||
    isExecutionPointsGreaterThan(targetExecutionPoint, currentExecutionPoint)
      ? "fast-forward"
      : "rewind";

  let jumpButtonText = "Jump to code";

  if (status in errorMessages) {
    jumpButtonText = errorMessages[status as JumpToCodeFailureReason];
  } else if (status === "loading") {
    jumpButtonText = "Loading...";
  }

  return (
    <div
      onClick={handleClick}
      onMouseEnter={onJumpButtonMouseEnter}
      onMouseLeave={onJumpButtonMouseLeave}
      className={jumpToCodeButtonClassname}
      data-test-name="JumpToCode"
    >
      <div className="flex items-center space-x-1">
        {isHovered && (
          <span className="truncate text-white" data-test-name="JumpToCodeButtonLabel">
            {jumpButtonText}
          </span>
        )}
        <Icon type={timeLabel} className="w-3.5 text-white" />
      </div>
    </div>
  );
}
