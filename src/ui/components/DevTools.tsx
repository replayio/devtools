import React, { useEffect, useState, useRef, Children, ReactChildren, ReactElement } from "react";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "../reducers";
import { UIState } from "ui/state";
import { clearTrialExpired, createSession } from "ui/actions/session";
import { useGetRecording, useGetRecordingId } from "ui/hooks/recordings";
import Header from "./Header/index";
import LoadingScreen from "./shared/LoadingScreen";
import NonDevView from "./Views/NonDevView";
import WaitForReduxSlice from "./WaitForReduxSlice";
import ReplayLogo from "./shared/ReplayLogo";

import {
  endUploadWaitTracking,
  maybeSetGuestMixpanelContext,
  trackEventOnce,
} from "ui/utils/mixpanel";
import KeyboardShortcuts from "./KeyboardShortcuts";
import { useUserIsAuthor } from "ui/hooks/users";
import { CommandPaletteModal } from "./CommandPalette/CommandPaletteModal";
import { decodeWorkspaceId } from "ui/utils/workspace";
import useAuth0 from "ui/utils/useAuth0";

const DevView = React.lazy(() => import("./Views/DevView"));

type _DevToolsProps = PropsFromRedux & DevToolsProps;

function ViewLoader() {
  const [showLoader, setShowLoader] = useState(false);
  const idRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    idRef.current = setTimeout(() => {
      setShowLoader(true);
    }, 5000);

    return () => clearTimeout(idRef.current!);
  });

  if (!showLoader) {
    return null;
  }

  return (
    <div className="absolute flex h-full w-full items-center justify-center bg-chrome">
      <ReplayLogo size="md" color="gray" />
    </div>
  );
}

function _DevTools({
  clearTrialExpired,
  createSession,
  loadingFinished,
  sessionId,
  showCommandPalette,
  uploadComplete,
  viewMode,
}: _DevToolsProps) {
  const { isAuthenticated } = useAuth0();
  const recordingId = useGetRecordingId();
  const { recording } = useGetRecording(recordingId);
  const { userIsAuthor, loading } = useUserIsAuthor();

  useEffect(() => {
    import("./Views/DevView");
  }, []);
  useEffect(() => {
    // Wait until we start rendering the DevTools component before potentially registering
    // a user as a guest in Mixpanel. This is to avoid sending too many unique distinct guest
    // users to Mixpanel.
    if (!isAuthenticated) {
      maybeSetGuestMixpanelContext();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (loading) {
      return;
    }

    trackEventOnce("session.devtools_start", {
      userIsAuthor,
      workspaceUuid: recording?.workspace?.id || null,
    });
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

  useEffect(() => {
    if (recording && document.title !== recording.title) {
      document.title = recording.title;
    }
  }, [recording]);

  if (!loadingFinished) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Header />
      {viewMode == "dev" ? (
        <React.Suspense fallback={<ViewLoader />}>
          <DevView />
        </React.Suspense>
      ) : (
        <NonDevView />
      )}
      {showCommandPalette ? <CommandPaletteModal /> : null}
      <KeyboardShortcuts />
    </>
  );
}

const connector = connect(
  (state: UIState) => ({
    loadingFinished: selectors.getLoadingFinished(state),
    viewMode: selectors.getViewMode(state),
    sessionId: selectors.getSessionId(state),
    showCommandPalette: selectors.getShowCommandPalette(state),
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
