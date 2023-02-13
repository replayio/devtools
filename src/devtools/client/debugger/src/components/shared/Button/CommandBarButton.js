import classnames from "classnames";
import React from "react";

import AccessibleImage from "../AccessibleImage";

export default function CommandBarButton({
  disabled = false,
  disabledTooltip = "",
  onClick,
  tooltip,
  type,
}) {
  return (
    <button
      className={classnames("command-bar-button")}
      title={disabled ? disabledTooltip : tooltip}
      onClick={onClick}
      disabled={disabled}
    >
      <AccessibleImage className={type} />
    </button>
  );
}
