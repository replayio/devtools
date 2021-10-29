import classnames from "classnames";
import React from "react";
import { connect, ConnectedProps, useSelector } from "react-redux";
import * as selectors from "ui/reducers/app";
import { UIState } from "ui/state";
import "./MaterialIcon.css";

const SIZE_STYLES = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
};

type MaterialIconProps = React.HTMLProps<HTMLDivElement> & {
  children: string;
  outlined?: boolean;
  // tailwind text color style, e.g. text-white, text-blue-200
  color?: string;
  iconSize?: keyof typeof SIZE_STYLES;
};

export default function MaterialIcon({
  children,
  className,
  outlined,
  color,
  iconSize = "base",
  ...rest
}: MaterialIconProps) {
  const fontLoading = useSelector((state: UIState) => selectors.getFontLoading(state));
  return (
    <div
      {...rest}
      className={classnames(
        "leading-none",
        className,
        {
          invisible: fontLoading,
        },
        outlined ? "material-icons-outlined" : "material-icons",
        SIZE_STYLES[iconSize]
      )}
    >
      {children}
    </div>
  );
}
