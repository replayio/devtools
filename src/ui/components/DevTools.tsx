import React, { useEffect, useState, useRef, useMemo } from "react";
import { connect, ConnectedProps, useSelector } from "react-redux";
import { selectors } from "../reducers";
import { UIState } from "ui/state";
import { clearTrialExpired, createSession } from "ui/actions/session";
import { useGetRecording, useGetRecordingId } from "ui/hooks/recordings";
import Header from "./Header/index";
import LoadingScreen from "./shared/LoadingScreen";
import WaitForReduxSlice from "./WaitForReduxSlice";
import ReplayLogo from "./shared/ReplayLogo";
import SplitBox from "devtools/client/shared/components/splitter/SplitBox";

import {
  endUploadWaitTracking,
  maybeSetGuestMixpanelContext,
  trackEventOnce,
} from "ui/utils/mixpanel";
import KeyboardShortcuts from "./KeyboardShortcuts";
import { useUserIsAuthor } from "ui/hooks/users";
import { CommandPaletteModal } from "./CommandPalette/CommandPaletteModal";
import useAuth0 from "ui/utils/useAuth0";
import { KeyModifiers } from "./KeyModifiers";
import Toolbar from "./Toolbar";
import Timeline from "./Timeline";
import SidePanel from "./SidePanel";
import Video from "./Video";
import { prefs } from "ui/utils/prefs";
import { getPaneCollapse } from "devtools/client/debugger/src/selectors";
import { getViewMode } from "ui/reducers/layout";
const Viewer = React.lazy(() => import("./Viewer"));

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

function Body() {
  const sidePanelCollapsed = useSelector(getPaneCollapse);
  const viewMode = useSelector(getViewMode);

  return (
    <div className="vertical-panels pr-2">
      <div className="flex h-full flex-row overflow-hidden bg-chrome">
        <Toolbar />
        <SplitBox
          startPanel={<SidePanel />}
          endPanel={
            viewMode === "dev" ? (
              <React.Suspense fallback={<ViewLoader />}>
                <Viewer />
              </React.Suspense>
            ) : (
              <Video />
            )
          }
          initialSize={prefs.sidePanelSize as `${number}px`}
          maxSize={sidePanelCollapsed ? "0" : "80%"}
          minSize={sidePanelCollapsed ? "0" : "240px"}
          onControlledPanelResized={(num: number) => (prefs.sidePanelSize = `${num}px`)}
          splitterSize={8}
          style={{ width: "100%", overflow: "hidden" }}
          vert={true}
        />
      </div>
      <Timeline />
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
  const isExternalRecording = useMemo(
    () => recording?.user && !recording.user.internal,
    [recording]
  );

  useEffect(() => {
    // We only track anonymous usage for recording by non-internal users so that
    // test runner cases (e.g. QA Wolf) are excluded.
    // Wait until we start rendering the DevTools component before potentially registering
    // a user as a guest in Mixpanel. This is to avoid sending too many unique distinct guest
    // users to Mixpanel.
    if (!isAuthenticated && isExternalRecording) {
      maybeSetGuestMixpanelContext();
    }
  }, [isAuthenticated, isExternalRecording]);

  useEffect(() => {
    if (loading) {
      return;
    }

    trackEventOnce("session.devtools_start", {
      userIsAuthor: !!userIsAuthor,
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
    <KeyModifiers>
      <Header />
      <Body />
      {showCommandPalette ? <CommandPaletteModal /> : null}
      <KeyboardShortcuts />
    </KeyModifiers>
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
