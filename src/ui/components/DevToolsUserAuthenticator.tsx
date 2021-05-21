import React, { useEffect } from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "../actions";
import { ExpectedError } from "ui/state/app";
import { BlankLoadingScreen } from "./shared/BlankScreen";
import useAuth0 from "ui/utils/useAuth0";
import { Recording } from "ui/types";
import DevTools from "./DevTools";

type DevToolsAuthenticatorProps = PropsFromRedux & {
  userId: string;
  recording: Recording;
  isAuthorized: boolean;
};

// This component is responsible for taking the loaded query data and handling
// unauthorized user access.
function DevToolsUserAuthenticator({
  userId,
  recording,
  isAuthorized,
  setExpectedError,
  setRecordingWorkspace,
}: DevToolsAuthenticatorProps) {
  const { isAuthenticated } = useAuth0();

  useEffect(function handleUnauthorizedAccess() {
    if (!isAuthorized) {
      let error: ExpectedError | undefined;

      if (isAuthenticated) {
        error = {
          message: "You don't have permission to view this replay",
          content:
            "Sorry, you can't access this Replay. If you were given this URL, make sure you were invited.",
        };
      } else {
        error = {
          message: "You need to sign in to view this replay",
          content:
            "You're trying to view a private replay. To proceed, we're going to need to you to sign in.",
          action: "sign-in",
        };
      }

      setExpectedError(error);
    }
  }, []);
  useEffect(function handleAuthorizedAccess() {
    document.title = `${recording.title} - Replay`;

    // This sets the replay's workspace in state for mixpanel to reference.
    if (recording.workspace) {
      setRecordingWorkspace(recording.workspace);
    }
  }, []);

  // If the user is not authorized, show a blank loading screen. After the first render cycle,
  // the useEffect will handle setting the state so that we render the corresponding
  // authentication error to be displayed to the user.
  if (!isAuthorized) {
    return <BlankLoadingScreen />;
  }

  return <DevTools userId={userId} recording={recording} />;
}

const connector = connect(() => ({}), {
  updateTimelineDimensions: actions.updateTimelineDimensions,
  setExpectedError: actions.setExpectedError,
  setRecordingWorkspace: actions.setRecordingWorkspace,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(DevToolsUserAuthenticator);
