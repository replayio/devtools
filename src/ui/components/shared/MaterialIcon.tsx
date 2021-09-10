import classnames from "classnames";
import React from "react";
import { connect, ConnectedProps } from "react-redux";
import * as selectors from "ui/reducers/app";
import { UIState } from "ui/state";
import "./MaterialIcon.css";

type MaterialIconProps = PropsFromRedux &
  React.HTMLProps<HTMLDivElement> & {
    children: string;
    highlighted?: boolean;
    outlined?: boolean;
  };

function MaterialIcon({
  children,
  fontLoading,
  highlighted,
  className,
  outlined,
  dispatch, // unused
  ...rest
}: MaterialIconProps) {
  return (
    <div
      {...rest}
      className={classnames(
        outlined ? "material-icons-outlined" : "material-icons",
        className,
        highlighted ? "text-primaryAccent" : "text-gray-800",
        { invisible: fontLoading }
      )}
    >
      {children}
    </div>
  );
}

const connector = connect((state: UIState) => ({ fontLoading: selectors.getFontLoading(state) }));
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(MaterialIcon);
