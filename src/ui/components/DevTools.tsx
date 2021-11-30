import React, { useEffect } from "react";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "../reducers";
import { UIState } from "ui/state";
import { clearTrialExpired, createSession } from "ui/actions/session";
import { useGetRecordingId } from "ui/hooks/recordings";
import Header from "./Header/index";
import LoadingScreen from "./shared/LoadingScreen";
import NonDevView from "./Views/NonDevView";
import WaitForReduxSlice from "./WaitForReduxSlice";

import { endUploadWaitTracking, trackEventOnce } from "ui/utils/mixpanel";
import KeyboardShortcuts from "./KeyboardShortcuts";
import { useUserIsAuthor } from "ui/hooks/users";

const DevView = React.lazy(() => import("./Views/DevView"));

type _DevToolsProps = PropsFromRedux & DevToolsProps;

function _DevTools({
  clearTrialExpired,
  loadingFinished,
  viewMode,
  createSession,
  uploadComplete,
  sessionId,
}: _DevToolsProps) {
  const recordingId = useGetRecordingId();
  const { userIsAuthor, loading } = useUserIsAuthor();

  useEffect(() => {
    if (loading) {
      return;
    }

    trackEventOnce("session.devtools_start", { userIsAuthor });
  }, [loading]);
  useEffect(() => {
    createSession(recordingId);

    return () => clearTrialExpired();
  }, [clearTrialExpired, recordingId]);
  useEffect(() => {
    if (uploadComplete && loadingFinished) {
      endUploadWaitTracking(sessionId!);
    }
  }, [uploadComplete, loadingFinished]);

  if (!loadingFinished) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Header />
      {viewMode == "dev" ? <DevView /> : <NonDevView />}
      <KeyboardShortcuts />
    </>
  );
}

const connector = connect(
  (state: UIState) => ({
    loadingFinished: selectors.getLoadingFinished(state),
    viewMode: selectors.getViewMode(state),
    sessionId: selectors.getSessionId(state),
  }),
  {
    createSession,
    clearTrialExpired,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
const ConnectedDevTools = connector(_DevTools);

type DevToolsProps = { uploadComplete: boolean };
const DevTools = (props: DevToolsProps) => (
  <WaitForReduxSlice slice="messages">
    <ConnectedDevTools {...props} />
  </WaitForReduxSlice>
);

export default DevTools;
