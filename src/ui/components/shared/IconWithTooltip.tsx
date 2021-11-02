import React, { useState, useRef } from "react";
// import "./IconWithTooltip.css";

interface IconWithTooltipProps {
  icon: React.ReactNode;
  content: string;
  handleClick: React.MouseEventHandler;
}

// This component is designed only for the primary toolbox icons (24x24) to the left
// of the viewport. The tooltip appears to the immediate right of the provided icon.
export default function IconWithTooltip({ icon, content, handleClick }: IconWithTooltipProps) {
  const timeoutKey = useRef<any>(null);
  const [hovered, setHovered] = useState(false);

  const handleMouseEnter = () => {
    timeoutKey.current = setTimeout(() => setHovered(true), 300);
  };
  const handleMouseLeave = () => {
    setHovered(false);
    clearTimeout(timeoutKey.current);
  };

  return (
    <div className="icon-with-tooltip text-sm">
      <button onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onClick={handleClick}>
        {icon}
      </button>
      {hovered ? <div className="icon-tooltip">{content}</div> : null}
    </div>
  );
}
