import React, { ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import { UnexpectedError } from "ui/state/app";
import { getUnexpectedError } from "ui/reducers/app";
import { setUnexpectedError } from "ui/actions/session";
import { isDevelopment } from "ui/utils/environment";
import { BlankViewportWrapper } from "./shared/Viewport";
import * as Sentry from "@sentry/react";

export const ReplayUpdatedError: UnexpectedError = {
  message: "Replay updated",
  content: "Replay was updated since you opened it. Please refresh the page.",
  action: "refresh",
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
      message: "Unexpected error",
      content: "An unexpected error occurred. Please refresh the page.",
      action: "refresh",
    });
  };

  return (
    <Sentry.ErrorBoundary onError={onError}>
      {unexpectedError ? <BlankViewportWrapper /> : children}
    </Sentry.ErrorBoundary>
  );
}
