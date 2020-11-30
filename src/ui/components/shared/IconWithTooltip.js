import React, { useState } from "react";
import "./IconWithTooltip.css";

// This component is designed only for the primary toolbox icons (24x24) to the left
// of the viewport. The tooltip appears to the immediate right of the provided icon.
export default function IconWithTooltip({ icon, content, handleClick }) {
  const [hovered, setHovered] = useState(false);
  const debounce = (fn, ms) => setTimeout(fn, ms);

  return (
    <div className="icon-with-tooltip">
      <button
        onMouseEnter={() => debounce(() => setHovered(true), 200)}
        onMouseLeave={() => debounce(() => setHovered(false), 200)}
        onClick={handleClick}
      >
        {icon}
      </button>
      {hovered ? <div className="icon-tooltip">{content}</div> : null}
    </div>
  );
}
