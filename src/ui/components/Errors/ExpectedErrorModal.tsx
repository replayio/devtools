import { useRouter } from "next/router";
import { ReactNode, useState } from "react";

import { Button } from "replay-next/components/Button";
import { clearExpectedError, setModal } from "ui/actions/app";
import { setExpectedError } from "ui/actions/errors";
import { useGetTeamIdFromRoute } from "ui/components/Library/Team/utils";
import { Dialog, DialogActions, DialogDescription, DialogTitle } from "ui/components/shared/Dialog";
import { DefaultViewportWrapper } from "ui/components/shared/Viewport";
import { useRequestRecordingAccess } from "ui/hooks/recordings";
import { useAppDispatch } from "ui/setup/hooks";
import { ErrorActions } from "ui/state/app";

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
  const router = useRouter();
  const dispatch = useAppDispatch();

  const onClick = async () => {
    const returnToPath = window.location.pathname + window.location.search;
    await router.push({ pathname: "/login", query: { returnTo: returnToPath } });
    dispatch(clearExpectedError());
  };

  return <Button onClick={onClick}>Sign in to Replay</Button>;
}

function TeamBillingButton() {
  const dispatch = useAppDispatch();

  const currentWorkspaceId = useGetTeamIdFromRoute();

  const router = useRouter();
  const onClick = async () => {
    await router.push(`/team/${currentWorkspaceId}/settings/billing`);
    dispatch(clearExpectedError());
    dispatch(setModal("workspace-settings"));
  };

  return <Button onClick={onClick}>Update Subscription</Button>;
}

function TryAgainButton({ onAction }: { onAction: () => void }) {
  return <Button onClick={onAction}>Try Again</Button>;
}
