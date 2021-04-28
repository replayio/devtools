import classnames from "classnames";
import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import "./MaterialIcon.css";

type MaterialIconProps = PropsFromRedux & { children: string; className?: string };

function MaterialIcon({ children, fontLoading, className }: MaterialIconProps) {
  return (
    <div className={classnames("material-icons", className, { invisible: fontLoading })}>
      {children}
    </div>
  );
}

const connector = connect((state: UIState) => ({ fontLoading: selectors.getFontLoading(state) }));
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(MaterialIcon);
