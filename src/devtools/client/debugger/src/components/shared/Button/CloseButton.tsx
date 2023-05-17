import { MouseEvent } from "react";

import AccessibleImage from "../AccessibleImage";

export default function CloseButton({
  handleClick,
  buttonClass = "",
  dataTestName,
  tooltip = "",
}: {
  handleClick?: (event: MouseEvent) => void;
  buttonClass?: string;
  dataTestName?: string;
  tooltip?: string;
}) {
  return (
    <button
      className={buttonClass ? `close-btn ${buttonClass}` : "close-btn"}
      data-test-name={dataTestName}
      onClick={handleClick}
      title={tooltip}
    >
      <AccessibleImage className="close" />
    </button>
  );
}
