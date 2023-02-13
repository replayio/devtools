import { MouseEvent } from "react";

import AccessibleImage from "../AccessibleImage";

export default function CloseButton({
  handleClick,
  buttonClass = "",
  tooltip = "",
}: {
  handleClick?: (event: MouseEvent) => void;
  buttonClass?: string;
  tooltip?: string;
}) {
  return (
    <button
      className={buttonClass ? `close-btn ${buttonClass}` : "close-btn"}
      onClick={handleClick}
      title={tooltip}
    >
      <AccessibleImage className="close" />
    </button>
  );
}
