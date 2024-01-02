import { ErrorInfo } from "react";
import { ErrorBoundary, ErrorBoundaryProps } from "react-error-boundary";

import { UnexpectedErrorForm } from "replay-next/components/errors/UnexpectedErrorForm";
import { setExpectedError, setUnexpectedError } from "ui/actions/errors";
import { getExpectedError, getUnexpectedError } from "ui/reducers/app";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import { ExpectedErrorModal } from "./ExpectedErrorModal";

// This error boundary handles root level fatal errors.
// In the event of an error, it will unmount the entire application and show a full screen error modal.
//
// This component is located in src/ui (rather than replay-next/components/errors) because it imports Redux reducers directly

export function RootErrorBoundary({
  children,
  name,
  ...rest
}: Omit<ErrorBoundaryProps, "fallback" | "fallbackRender" | "FallbackComponent" | "resetKeys"> & {
  name: string;
}) {
  const expectedError = useAppSelector(getExpectedError);
  const unexpectedError = useAppSelector(getUnexpectedError);
  const dispatch = useAppDispatch();

  const onError = (error: Error, info: ErrorInfo) => {
    if (error instanceof Error && error.name === "ChunkLoadError") {
      dispatch(
        setExpectedError({
          message: "Replay updated",
          content: "Replay was updated since you opened it. Please refresh the page.",
          action: "refresh",
        })
      );
    } else {
      dispatch(
        setUnexpectedError({
          message: "Unexpected error",
          content: "Something went wrong, but you can refresh the page to try again.",
          action: "refresh",
        })
      );
    }
  };

  if (expectedError) {
    return (
      <ExpectedErrorModal
        action="refresh"
        details={expectedError.content ?? ""}
        title={expectedError.message ?? "Error"}
      />
    );
  } else if (unexpectedError) {
    return (
      <UnexpectedErrorForm
        details={unexpectedError.content ?? ""}
        title={unexpectedError.message ?? "Error"}
      />
    );
  } else {
    return (
      <ErrorBoundary fallback={null} onError={onError} {...rest}>
        {children}
      </ErrorBoundary>
    );
  }
}
