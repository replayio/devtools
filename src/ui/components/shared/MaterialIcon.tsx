import classnames from "classnames";
import React from "react";
import { connect, ConnectedProps } from "react-redux";
import * as selectors from "ui/reducers/app";
import { UIState } from "ui/state";
import "./MaterialIcon.css";

const SIZE_STYLES = {
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
};

type MaterialIconProps = PropsFromRedux &
  React.HTMLProps<HTMLDivElement> & {
    children: string;
    outlined?: boolean;
    // tailwind text color style, e.g. text-white, text-blue-200
    color?: string;
    iconSize?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "old";
  };

function MaterialIcon({
  children,
  fontLoading,
  className,
  outlined,
  color,
  iconSize = "base",
  ...rest
}: MaterialIconProps) {
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

const connector = connect((state: UIState) => ({ fontLoading: selectors.getFontLoading(state) }));
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(MaterialIcon);
