import { ReactNode, useState } from "react";

import { Button } from "replay-next/components/Button";
import { setExpectedError } from "ui/actions/errors";
import { Dialog, DialogActions, DialogDescription, DialogTitle } from "ui/components/shared/Dialog";
import { DefaultViewportWrapper } from "ui/components/shared/Viewport";
import { useRequestRecordingAccess } from "ui/hooks/recordings";
import { getRecordingWorkspace } from "ui/reducers/app";
import { useAppDispatch } from "ui/setup/hooks";
import { useAppSelector } from "ui/setup/hooks";
import { ErrorActions } from "ui/state/app";
import { login } from "ui/utils/auth";

// Full screen modal to be shown in the event of an expected error that is fatal/blocking.
// For example, no recording id or no access to a recording.
// This component should be configured to show a specific resolution action (e.g. "go to library")
//
// This component is located in src/ui (rather than replay-next/components/errors) because it imports Redux actions and reducers directly

export function ExpectedErrorModal({
  action,
  details,
  onDismiss,
  title,
}: {
  action?: ErrorActions;
  details: string;
  onDismiss?: () => void;
  title: string;
}) {
  let actionButton: ReactNode = null;

  switch (action) {
    case "refresh": {
      actionButton = <RefreshButton />;
      break;
    }
    case "sign-in": {
      actionButton = <SignInButton />;
      break;
    }
    case "library": {
      actionButton = <GoToLibraryButton />;
      break;
    }
    case "team-billing": {
      actionButton = <TeamBillingButton />;
      break;
    }
    case "request-access": {
      actionButton = <RequestRecordingAccessButton />;
      break;
    }
    case "try-again": {
      if (onDismiss) {
        actionButton = <TryAgainButton onAction={onDismiss} />;
      }
      break;
    }
  }

  return (
    <DefaultViewportWrapper>
      <Dialog dataTestId="ExpectedError" showFooterLinks={true} showIllustration={true}>
        <DialogTitle data-test-name="ErrorTitle">{title}</DialogTitle>
        {details && <DialogDescription data-test-name="ErrorDetails">{details}</DialogDescription>}
        {actionButton ? <DialogActions>{actionButton}</DialogActions> : null}
      </Dialog>
    </DefaultViewportWrapper>
  );
}

function GoToLibraryButton() {
  const onClick = () => {
    window.location.href = window.location.origin;
  };

  return <Button onClick={onClick}>Back to Library</Button>;
}

function RefreshButton() {
  const [clicked, setClicked] = useState(false);
  const onClick = () => {
    setClicked(true);
    location.reload();
  };

  return <Button onClick={onClick}>{clicked ? `Refreshing...` : `Refresh`}</Button>;
}

function RequestRecordingAccessButton() {
  const requestRecordingAccess = useRequestRecordingAccess();
  const dispatch = useAppDispatch();

  const onClick = () => {
    requestRecordingAccess();

    // Switch out the current error for one that will bring them back to the library
    dispatch(
      setExpectedError({
        message: "Hang tight!",
        content:
          "We notified the owner that you requested access and will email you when you're approved.",
        action: "library",
      })
    );
  };

  return <Button onClick={onClick}>Request access</Button>;
}

function SignInButton() {
  return <Button onClick={() => login()}>Sign in to Replay</Button>;
}

function TeamBillingButton() {
  const workspace = useAppSelector(getRecordingWorkspace);
  const currentWorkspaceId = workspace?.id ?? "me";

  const onClick = () => {
    window.location.href = `${window.location.origin}/team/${currentWorkspaceId}/settings/billing`;
  };

  return <Button onClick={onClick}>Update Subscription</Button>;
}

function TryAgainButton({ onAction }: { onAction: () => void }) {
  return <Button onClick={onAction}>Try Again</Button>;
}
