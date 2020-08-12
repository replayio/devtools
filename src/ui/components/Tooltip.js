const React = require("react");
const ReactDOM = require("react-dom");

export default function Tooltip({ tooltip }) {
  if (!tooltip) {
    return null;
  }

  return (
    <div className="timeline-tooltip" style={{ left: tooltip.left }}>
      {tooltip.screen && (
        <img
          className="timeline-tooltip-image"
          src={`data:${tooltip.screen.mimeType};base64,${tooltip.screen.data}`}
        />
      )}
    </div>
  );
}
