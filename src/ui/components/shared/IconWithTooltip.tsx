import React, { useRef, useState, useEffect } from "react";
import ReactDOM from "react-dom";

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
  const timeoutKey = useRef<any>(null);
  const [targetNode, setTargetNode] = useState<HTMLElement | null>(null);
  const [hovered, setHovered] = useState(false);

  const handleMouseEnter = () => {
    timeoutKey.current = setTimeout(() => setHovered(true), 300);
  };
  const handleMouseLeave = () => {
    setHovered(false);
    clearTimeout(timeoutKey.current);
  };

  useEffect(() => {
    return () => {
      clearTimeout(timeoutKey.current);
    };
  }, []);

  return (
    <div className="icon-with-tooltip text-sm">
      <button
        className="icon-with-tooltip-button"
        data-test-name={dataTestName}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        ref={node => setTargetNode(node)}
      >
        {icon}
      </button>
      {targetNode && hovered ? <IconTooltip targetNode={targetNode}>{content}</IconTooltip> : null}
    </div>
  );
}

function IconTooltip({ targetNode, children }: { targetNode: HTMLElement; children: string }) {
  const { top, left } = targetNode.getBoundingClientRect();
  let style = { top: `${top}px`, left: `${left}px` };

  return ReactDOM.createPortal(
    <div className="icon-tooltip absolute z-10 ml-10 mt-0.5" style={style}>
      <div className="rounded-md bg-tooltipBgcolor px-2 py-1 text-sm text-tooltipColor">
        {children}
      </div>
    </div>,
    document.body
  );
}
