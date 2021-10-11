// import classnames from "classnames";
import React from "react";
import { connect, ConnectedProps } from "react-redux";
import * as selectors from "ui/reducers/app";
import { UIState } from "ui/state";
import "./MaterialIcon.css";

type MaterialIconProps = PropsFromRedux &
  React.HTMLProps<HTMLDivElement> & {
    children: string;
    outlined?: boolean;
    // tailwind text color style, e.g. text-white, text-blue-200
    color?: string;
  };

function MaterialIcon({
  children,
  fontLoading,
  className,
  outlined,
  color,
  dispatch, // unused
  ...rest
}: MaterialIconProps) {
  return (
    <div
      {...rest}
      className={classnames(outlined ? "material-icons-outlined" : "material-icons", className, {
        invisible: fontLoading,
      })}
    >
      {children}
    </div>
  );
}

const connector = connect((state: UIState) => ({ fontLoading: selectors.getFontLoading(state) }));
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(MaterialIcon);
