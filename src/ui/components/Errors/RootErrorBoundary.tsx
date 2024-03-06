import { ErrorInfo } from "react";
import { ErrorBoundary, ErrorBoundaryProps } from "react-error-boundary";

import { UnexpectedErrorForm } from "replay-next/components/errors/UnexpectedErrorForm";
import { ReplayClientInterface } from "shared/client/types";
import { setExpectedError, setUnexpectedError } from "ui/actions/errors";
import { RootErrorDocumentTitle } from "ui/components/Errors/RootErrorDocumentTitle";
import { useGetUserInfo } from "ui/hooks/users";
import { getExpectedError, getUnexpectedError } from "ui/reducers/app";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import { ExpectedErrorModal } from "./ExpectedErrorModal";

// This error boundary handles root level fatal errors.
// In the event of an error, it will unmount the entire application and show a full screen error modal.
//
// This component is located in src/ui (rather than replay-next/components/errors) because it imports Redux reducers directly

export function RootErrorBoundary({
  children,
  replayClient,
  ...rest
}: Omit<ErrorBoundaryProps, "fallback" | "fallbackRender" | "FallbackComponent" | "resetKeys"> & {
  replayClient: ReplayClientInterface;
}) {
  const expectedError = useAppSelector(getExpectedError);
  const unexpectedError = useAppSelector(getUnexpectedError);
  const dispatch = useAppDispatch();

  const currentUserInfo = useGetUserInfo();

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
      <>
        <RootErrorDocumentTitle />
        <ExpectedErrorModal
          action={expectedError.action ?? "refresh"}
          details={expectedError.content ?? ""}
          title={expectedError.message ?? "Error"}
        />
      </>
    );
  } else if (unexpectedError) {
    return (
      <>
        <RootErrorDocumentTitle />
        <UnexpectedErrorForm
          currentUserEmail={currentUserInfo?.email ?? null}
          currentUserId={currentUserInfo?.id ?? null}
          currentUserName={currentUserInfo?.name ?? null}
          details={unexpectedError.content ?? ""}
          replayClient={replayClient}
          title={unexpectedError.message ?? "Session error"}
        />
      </>
    );
  } else {
    return (
      <ErrorBoundary fallback={null} onError={onError} {...rest}>
        {children}
      </ErrorBoundary>
    );
  }
}
