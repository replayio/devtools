import useTooltip from "replay-next/src/hooks/useTooltip";

import styles from "./IconWithTooltip.module.css";

interface IconWithTooltipProps {
  dataTestName?: string;
  icon: React.ReactNode;
  content: string;
  handleClick: React.MouseEventHandler;
}

// This component is designed only for the primary toolbox icons (24x24) to the left
// of the viewport. The tooltip appears to the immediate right of the provided icon.
export default function IconWithTooltip({
  dataTestName,
  icon,
  content,
  handleClick,
}: IconWithTooltipProps) {
  const { onMouseEnter, onMouseLeave, tooltip } = useTooltip({
    delay: 120,
    position: "right-of",
    tooltip: content,
  });

  return (
    <div>
      <button
        className={styles.iconWithTooltipButton}
        data-test-name={dataTestName}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={handleClick}
      >
        {icon}
      </button>
      {tooltip}
    </div>
  );
}
