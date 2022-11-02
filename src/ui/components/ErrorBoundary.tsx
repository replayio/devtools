import * as Sentry from "@sentry/react";
import React, { ReactNode } from "react";

import { setUnexpectedError } from "ui/actions/errors";
import { getUnexpectedError } from "ui/reducers/app";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { UnexpectedError } from "ui/state/app";
import { isDevelopment } from "ui/utils/environment";

import { BlankViewportWrapper } from "./shared/Viewport";

export const ReplayUpdatedError: UnexpectedError = {
  message: "Replay updated",
  content: "Replay was updated since you opened it. Please refresh the page.",
  action: "refresh",
};

export default function ErrorBoundary({ children }: { children: ReactNode }) {
  const unexpectedError = useAppSelector(getUnexpectedError);
  const dispatch = useAppDispatch();

  const onError = (error: Error) => {
    if (error.name === "ChunkLoadError") {
      return dispatch(setUnexpectedError(ReplayUpdatedError, true));
    }

    if (error.name === "CommandError" || isDevelopment()) {
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
