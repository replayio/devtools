import { ThreadFront } from "protocol/thread";
import React, { useEffect, useState, useRef, useMemo } from "react";
import { connect, ConnectedProps } from "react-redux";
import { useAppSelector } from "ui/setup/hooks";
import { clearTrialExpired, createSocket } from "ui/actions/session";
import { useGetRecording, useGetRecordingId } from "ui/hooks/recordings";
import { UIState } from "ui/state";

import { selectors } from "../reducers";

import Header from "./Header/index";
import LoadingScreen from "./shared/LoadingScreen";
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
import { ReduxAnnotationsProvider } from "./SecondaryToolbox/redux-devtools/ReduxAnnotationsProvider";
import useAuth0 from "ui/utils/useAuth0";
import { KeyModifiers } from "./KeyModifiers";
import Toolbar from "./Toolbar";
import Timeline from "./Timeline";
import SidePanel from "./SidePanel";
import Video from "./Video";
import { prefs } from "ui/utils/prefs";
import { getPaneCollapse } from "devtools/client/debugger/src/selectors";
import { getViewMode } from "ui/reducers/layout";
import { useTrackLoadingIdleTime } from "ui/hooks/tracking";

const Viewer = React.lazy(() => import("./Viewer"));

type DevToolsProps = PropsFromRedux & { uploadComplete: boolean };

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
    <div className="absolute flex items-center justify-center w-full h-full bg-chrome">
      <ReplayLogo size="md" color="gray" />
    </div>
  );
}

function Body() {
  const sidePanelCollapsed = useAppSelector(getPaneCollapse);
  const viewMode = useAppSelector(getViewMode);

  return (
    <div className="pr-2 vertical-panels">
      <div className="flex flex-row h-full overflow-hidden bg-chrome">
        <Toolbar />
        <ReduxAnnotationsProvider>
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
        </ReduxAnnotationsProvider>
      </div>
      <Timeline />
    </div>
  );
}

function _DevTools({
  clearTrialExpired,
  createSocket,
  loadedRegions,
  loadingFinished,
  sessionId,
  showCommandPalette,
  uploadComplete,
}: DevToolsProps) {
  const { isAuthenticated } = useAuth0();
  const recordingId = useGetRecordingId();
  const { recording } = useGetRecording(recordingId);
  const { trackLoadingIdleTime } = useTrackLoadingIdleTime(uploadComplete, recording);
  const { userIsAuthor, loading } = useUserIsAuthor();
  const isExternalRecording = useMemo(
    () => recording?.user && !recording.user.internal,
    [recording]
  );

  useEffect(() => {
    import("./Viewer");
  }, []);
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
  });

  useEffect(() => {
    createSocket(recordingId, ThreadFront);

    return () => {
      clearTrialExpired();
    };
  }, [clearTrialExpired, createSocket, recordingId]);

  useEffect(() => {
    if (uploadComplete && loadingFinished) {
      endUploadWaitTracking(sessionId!);
    }
  }, [loadingFinished, uploadComplete, sessionId]);

  useEffect(() => {
    if (loadingFinished) {
      trackLoadingIdleTime(sessionId!);
    }
  }, [loadingFinished, trackLoadingIdleTime, sessionId]);

  useEffect(() => {
    if (recording?.title && document.title !== recording.title) {
      document.title = recording.title;
    }
  }, [recording]);

  if (!loadingFinished) {
    return <LoadingScreen fallbackMessage="Starting your session..." />;
  }

  if (loadedRegions === null) {
    return <LoadingScreen fallbackMessage="Loading timeline..." />;
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
    loadedRegions: selectors.getLoadedRegions(state),
    sessionId: selectors.getSessionId(state),
    showCommandPalette: selectors.getShowCommandPalette(state),
  }),
  {
    createSocket,
    clearTrialExpired,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
const ConnectedDevTools = connector(_DevTools);

export default ConnectedDevTools;
