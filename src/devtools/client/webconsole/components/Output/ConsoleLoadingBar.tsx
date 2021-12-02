import React, { ReactNode } from "react";
import { connect, ConnectedProps } from "react-redux";
import LoadingProgressBar from "ui/components/shared/LoadingProgressBar";
import { UIState } from "ui/state";
import { hasPendingLogGroupIds } from "../../selectors/messages";

function ConsoleLoadingBar({ hasPendingLogGroupIds }: PropsFromRedux) {
  if (!hasPendingLogGroupIds) {
    return null;
  }

  return <LoadingProgressBar />;
}

const connector = connect((state: UIState) => ({
  hasPendingLogGroupIds: hasPendingLogGroupIds(state),
}));
export type PropsFromRedux = ConnectedProps<typeof connector> & { children: ReactNode };

export default connector(ConsoleLoadingBar);
