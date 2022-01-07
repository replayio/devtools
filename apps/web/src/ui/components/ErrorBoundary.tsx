import React, { Component, ReactNode } from "react";
import { connect, ConnectedProps } from "react-redux";
import { UIState } from "ui/state";
import { UnexpectedError } from "ui/state/app";
import { getUnexpectedError } from "ui/reducers/app";
import { setUnexpectedError } from "ui/actions/session";
import { isDevelopment } from "ui/utils/environment";
import { BlankViewportWrapper } from "./shared/Viewport";

export const ReplayUpdatedError: UnexpectedError = {
  message: "Replay updated",
  content: "Replay was updated since you opened it. Please refresh the page.",
  action: "refresh",
};

class ErrorBoundary extends Component<PropsFromRedux & { children: ReactNode }> {
  componentDidCatch(error: any, errorInfo: any) {
    const { setUnexpectedError } = this.props;

    if (error.name === "ChunkLoadError") {
      return setUnexpectedError(ReplayUpdatedError, true);
    }

    if (isDevelopment()) {
      return;
    }

    setUnexpectedError({
      message: "Unexpected error",
      content: "An unexpected error occurred. Please refresh the page.",
      action: "refresh",
    });
  }

  render() {
    const { unexpectedError } = this.props;
    return unexpectedError ? <BlankViewportWrapper /> : this.props.children;
  }
}

const connector = connect(
  (state: UIState) => ({
    unexpectedError: getUnexpectedError(state),
  }),
  {
    setUnexpectedError,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(ErrorBoundary);
