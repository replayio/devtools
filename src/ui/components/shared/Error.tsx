import React, { useState } from "react";
import useAuth0 from "ui/utils/useAuth0";
import Modal from "ui/components/shared/NewModal";
import { connect, ConnectedProps, useDispatch } from "react-redux";
import * as selectors from "ui/reducers/app";
import { UIState } from "ui/state";
import classNames from "classnames";
import { ErrorActions, ExpectedError, UnexpectedError } from "ui/state/app";
import hooks from "ui/hooks";
import { setModal } from "ui/actions/app";
import { Dialog, DialogActions, DialogDescription, DialogLogo, DialogTitle } from "./Dialog";
import { PrimaryButton } from "./Button";
import { useRouter } from "next/dist/client/router";
import { BubbleViewportWrapper } from "./Viewport";
import { getRecordingId } from "ui/utils/recording";
import { setExpectedError } from "ui/actions/session";
import { useRequestRecordingAccess } from "ui/hooks/recordings";

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
    <PrimaryButton className="mx-2 flex-1 justify-center" color="blue" onClick={onClick}>
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

function TeamBillingButtonBase({ currentWorkspaceId, setModal }: BillingPropsFromRedux) {
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

const billingConnector = connect(
  (state: UIState) => ({
    currentWorkspaceId: selectors.getWorkspaceId(state),
  }),
  { setModal }
);
type BillingPropsFromRedux = ConnectedProps<typeof billingConnector>;
const TeamBillingButton = billingConnector(TeamBillingButtonBase);

function RequestRecordingAccessButton() {
  const requestRecordingAccess = useRequestRecordingAccess();
  const dispatch = useDispatch();

  const onClick = () => {
    requestRecordingAccess();

    // Switch out the current error for one that will bring them back to the library
    dispatch(
      setExpectedError({
        message: "Hang tight!",
        content:
          "We've let the owner know about your request. We'll notify you by e-mail once it's been accepted",
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

function ActionButton({ action }: { action: ErrorActions }) {
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
  }

  return null;
}

interface ErrorProps {
  error: ExpectedError | UnexpectedError;
}

function Error({ error }: ErrorProps) {
  const { action, message, content } = error;

  return (
    <Dialog style={{ animation: "dropdownFadeIn ease 200ms", width: 400 }}>
      <DialogLogo />
      <DialogTitle>{message}</DialogTitle>
      {content && <DialogDescription>{content}</DialogDescription>}
      {action ? (
        <DialogActions>
          <ActionButton action={action} />
        </DialogActions>
      ) : null}
    </Dialog>
  );
}

function ExpectedErrorScreen({ error }: { error: ExpectedError }) {
  return (
    <BubbleViewportWrapper>
      <Error error={error} />
    </BubbleViewportWrapper>
  );
}

function UnexpectedErrorScreen({ error }: { error: UnexpectedError }) {
  return (
    <BubbleViewportWrapper>
      <Error error={error} />
    </BubbleViewportWrapper>
  );
}

function TrialExpired() {
  const recordingId = getRecordingId();
  const { recording, loading } = hooks.useGetRecording(recordingId!);

  return (
    <Modal options={{ maskTransparency: "translucent" }}>
      <Dialog
        style={{ animation: "dropdownFadeIn ease 200ms", width: 400 }}
      >
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
  expectedError: selectors.getExpectedError(state),
  unexpectedError: selectors.getUnexpectedError(state),
  trialExpired: selectors.getTrialExpired(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(_AppErrors);
export { ExpectedErrorScreen, UnexpectedErrorScreen };
