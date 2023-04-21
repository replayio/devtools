import classnames from "classnames";
import { MouseEvent } from "react";

import AccessibleImage from "../AccessibleImage";

export default function CommandBarButton({
  disabled,
  disabledTooltip = "",
  onClick,
  tooltip,
  type,
}: {
  disabled: boolean;
  disabledTooltip?: string;
  onClick: (event: MouseEvent) => void;
  tooltip: string;
  type: string;
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
