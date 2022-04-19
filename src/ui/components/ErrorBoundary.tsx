import * as Sentry from "@sentry/react";
import React, { ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setUnexpectedError } from "ui/actions/session";
import { getUnexpectedError } from "ui/reducers/app";
import { UnexpectedError } from "ui/state/app";
import { isDevelopment } from "ui/utils/environment";

import { BlankViewportWrapper } from "./shared/Viewport";

export const ReplayUpdatedError: UnexpectedError = {
  action: "refresh",
  content: "Replay was updated since you opened it. Please refresh the page.",
  message: "Replay updated",
};

export default function ErrorBoundary({ children }: { children: ReactNode }) {
  const unexpectedError = useSelector(getUnexpectedError);
  const dispatch = useDispatch();

  const onError = (error: Error) => {
    if (error.name === "ChunkLoadError") {
      return dispatch(setUnexpectedError(ReplayUpdatedError, true));
    }

    if (isDevelopment()) {
      return;
    }

    setUnexpectedError({
      action: "refresh",
      content: "An unexpected error occurred. Please refresh the page.",
      message: "Unexpected error",
    });
  };

  return (
    <Sentry.ErrorBoundary onError={onError}>
      {unexpectedError ? <BlankViewportWrapper /> : children}
    </Sentry.ErrorBoundary>
  );
}
