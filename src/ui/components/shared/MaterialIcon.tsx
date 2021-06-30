import classnames from "classnames";
import React from "react";
import { connect, ConnectedProps } from "react-redux";
import * as selectors from "ui/reducers/app";
import { UIState } from "ui/state";
import "./MaterialIcon.css";

type MaterialIconProps = PropsFromRedux & {
  children: string;
  highlighted?: boolean;
  className?: string;
};

function MaterialIcon({ children, fontLoading, highlighted, className }: MaterialIconProps) {
  return (
    <div
      className={classnames(
        "material-icons",
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
