import useTooltip from "replay-next/src/hooks/useTooltip";

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
    className: "icon-tooltip",
    delay: 250,
    position: "right-of",
    tooltip: content,
  });

  return (
    <div className="icon-with-tooltip text-sm">
      <button
        className="icon-with-tooltip-button"
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
