import { useRouter } from "next/dist/client/router";
import React, { useState } from "react";
import { ConnectedProps, connect } from "react-redux";

import { getRecordingId } from "shared/utils/recording";
import { setModal } from "ui/actions/app";
import { setExpectedError } from "ui/actions/errors";
import { useGetTeamIdFromRoute } from "ui/components/Library/Team/utils";
import Modal from "ui/components/shared/NewModal";
import hooks from "ui/hooks";
import { useRequestRecordingAccess } from "ui/hooks/recordings";
import { getExpectedError, getTrialExpired, getUnexpectedError } from "ui/reducers/app";
import { useAppDispatch } from "ui/setup/hooks";
import { UIState } from "ui/state";
import { ErrorActions, ExpectedError, UnexpectedError } from "ui/state/app";

import { PrimaryButton } from "./Button";
import { Dialog, DialogActions, DialogDescription, DialogLogo, DialogTitle } from "./Dialog";
import { DefaultViewportWrapper } from "./Viewport";

export function PopupBlockedError() {
  return (
    <ExpectedErrorScreen
      error={{
        message: "Please turn off your ad blocker",
        content:
          "In order to proceed, we need to get you to confirm your credentials. This happens in a separate pop-up window that's currently being blocked by your browser. Please disable your ad-blocker refresh this page.",
        action: "refresh",
      }}
    />
  );
}

function RefreshButton() {
  const [clicked, setClicked] = useState(false);
  const onClick = () => {
    setClicked(true);
    location.reload();
  };

  return (
    <PrimaryButton color="blue" onClick={onClick}>
      {clicked ? `Refreshing...` : `Refresh`}
    </PrimaryButton>
  );
}

function SignInButton() {
  const router = useRouter();

  const onClick = () => {
    const returnToPath = window.location.pathname + window.location.search;
    router.push({ pathname: "/login", query: { returnTo: returnToPath } });
  };

  return (
    <PrimaryButton color="blue" onClick={onClick}>
      Sign in to Replay
    </PrimaryButton>
  );
}

function LibraryButton() {
  const onClick = () => {
    window.location.href = window.location.origin;
  };

  return (
    <PrimaryButton color="blue" onClick={onClick}>
      Back to Library
    </PrimaryButton>
  );
}

function TeamBillingButtonBase({ setModal }: BillingPropsFromRedux) {
  const currentWorkspaceId = useGetTeamIdFromRoute();

  const router = useRouter();
  const onClick = () => {
    router.push(`/team/${currentWorkspaceId}/settings/billing`);
    setModal("workspace-settings");
  };

  return (
    <PrimaryButton color="blue" onClick={onClick}>
      Update Subscription
    </PrimaryButton>
  );
}

const billingConnector = connect(null, { setModal });
type BillingPropsFromRedux = ConnectedProps<typeof billingConnector>;
const TeamBillingButton = billingConnector(TeamBillingButtonBase);

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

  return (
    <PrimaryButton color="blue" onClick={onClick}>
      Request access
    </PrimaryButton>
  );
}

function TryAgainButton({ onAction }: { onAction: () => void }) {
  return (
    <PrimaryButton color="blue" onClick={onAction}>
      Try Again
    </PrimaryButton>
  );
}

function ActionButton({ action, onAction }: { action: ErrorActions; onAction?: () => void }) {
  if (action === "refresh") {
    return <RefreshButton />;
  } else if (action === "sign-in") {
    return <SignInButton />;
  } else if (action === "library") {
    return <LibraryButton />;
  } else if (action === "team-billing") {
    return <TeamBillingButton />;
  } else if (action === "request-access") {
    return <RequestRecordingAccessButton />;
  } else if (action === "try-again" && onAction) {
    return <TryAgainButton onAction={onAction} />;
  }

  return null;
}

interface ErrorProps {
  error: ExpectedError | UnexpectedError;
}

function Error({ error }: ErrorProps) {
  const { action, message, content } = error;

  return (
    <div data-testid="Error">
      <Dialog showFooterLinks={true} showIllustration={true}>
        <DialogTitle>{message}</DialogTitle>
        {content && <DialogDescription>{content}</DialogDescription>}
        {action ? (
          <DialogActions>
            <ActionButton
              action={action}
              onAction={"onAction" in error ? error.onAction : undefined}
            />
          </DialogActions>
        ) : null}
      </Dialog>
    </div>
  );
}

function ExpectedErrorScreen({ error }: { error: ExpectedError }) {
  return (
    <DefaultViewportWrapper>
      <Error error={error} />
    </DefaultViewportWrapper>
  );
}

function UnexpectedErrorScreen({ error }: { error: UnexpectedError }) {
  return (
    <DefaultViewportWrapper>
      <Error error={error} />
    </DefaultViewportWrapper>
  );
}

function TrialExpired() {
  const recordingId = getRecordingId();
  const { recording, loading } = hooks.useGetRecording(recordingId!);

  return (
    <Modal options={{ maskTransparency: "translucent" }}>
      <Dialog>
        <DialogLogo />
        <DialogTitle>Free Trial Expired</DialogTitle>
        <DialogDescription>
          This replay is unavailable because it was recorded after your team's free trial expired.
        </DialogDescription>
        <DialogActions>
          <ActionButton
            action={loading || recording?.userRole !== "team-admin" ? "library" : "team-billing"}
          />
        </DialogActions>
      </Dialog>
    </Modal>
  );
}

function _AppErrors({ expectedError, unexpectedError, trialExpired }: PropsFromRedux) {
  return (
    <>
      {trialExpired && <TrialExpired />}
      {expectedError ? <ExpectedErrorScreen error={expectedError} /> : null}
      {unexpectedError ? <UnexpectedErrorScreen error={unexpectedError} /> : null}
    </>
  );
}

const connector = connect((state: UIState) => ({
  expectedError: getExpectedError(state),
  unexpectedError: getUnexpectedError(state),
  trialExpired: getTrialExpired(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(_AppErrors);
export { ExpectedErrorScreen, UnexpectedErrorScreen };
