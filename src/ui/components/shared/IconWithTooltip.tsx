import { MouseEventHandler } from "react";

import useTooltip from "replay-next/src/hooks/useTooltip";

// This component is designed only for the primary toolbox icons (24x24) to the left
// of the viewport. The tooltip appears to the immediate right of the provided icon.
export default function IconWithTooltip({
  className = "",
  content,
  dataTestName,
  icon,
  onClick,
}: {
  className?: string;
  content: string;
  dataTestName?: string;
  icon: React.ReactNode;
  onClick?: MouseEventHandler;
}) {
  const { onMouseEnter, onMouseLeave, tooltip } = useTooltip({
    delay: 120,
    position: "right-of",
    tooltip: content,
  });

  return (
    <>
      <button
        className={className}
        data-test-name={dataTestName}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {icon}
      </button>
      {tooltip}
    </>
  );
}
