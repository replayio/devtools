import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConnectedProps, connect } from "react-redux";

import { PointsContextRoot } from "bvaughn-architecture-demo/src/contexts/PointsContext";
import { SelectedFrameContextRoot } from "bvaughn-architecture-demo/src/contexts/SelectedFrameContext";
import usePreferredFontSize from "bvaughn-architecture-demo/src/hooks/usePreferredFontSize";
import InspectorContextReduxAdapter from "devtools/client/debugger/src/components/shared/InspectorContextReduxAdapter";
import { getPaneCollapse } from "devtools/client/debugger/src/selectors";
import SplitBox from "devtools/client/shared/components/splitter/SplitBox";
import { ThreadFront } from "protocol/thread";
import { clearTrialExpired, createSocket } from "ui/actions/session";
import TerminalContextAdapter from "ui/components/SecondaryToolbox/TerminalContextAdapter";
import { useGetRecording, useGetRecordingId } from "ui/hooks/recordings";
import { useFeature } from "ui/hooks/settings";
import { useTrackLoadingIdleTime } from "ui/hooks/tracking";
import { useUserIsAuthor } from "ui/hooks/users";
import { getViewMode } from "ui/reducers/layout";
import { useAppSelector } from "ui/setup/hooks";
import { UIState } from "ui/state";
import { isTest } from "ui/utils/environment";
import {
  endUploadWaitTracking,
  maybeSetGuestMixpanelContext,
  trackEventOnce,
} from "ui/utils/mixpanel";
import { prefs } from "ui/utils/prefs";
import tokenManager, { TokenState } from "ui/utils/tokenManager";
import useAuth0 from "ui/utils/useAuth0";

import { selectors } from "../reducers";
import { CommandPaletteModal } from "./CommandPalette/CommandPaletteModal";
import FocusContextReduxAdapter from "./FocusContextReduxAdapter";
import Header from "./Header/index";
import KeyboardShortcuts from "./KeyboardShortcuts";
import { KeyModifiers } from "./KeyModifiers";
import { ReduxAnnotationsProvider } from "./SecondaryToolbox/redux-devtools/ReduxAnnotationsProvider";
import TimelineContextAdapter from "./SecondaryToolbox/TimelineContextAdapter";
import SelectedFrameContextAdapter from "./SelectedFrameContextAdapter";
import SessionContextAdapter from "./SessionContextAdapter";
import LoadingScreen from "./shared/LoadingScreen";
import ReplayLogo from "./shared/ReplayLogo";
import SidePanel from "./SidePanel";
import SourcesContextAdapter from "./SourcesContextAdapter";
import Timeline from "./Timeline";
import Toolbar from "./Toolbar";
import Video from "./Video";

const Viewer = React.lazy(() => import("./Viewer"));

type DevToolsProps = PropsFromRedux & { apiKey?: string; uploadComplete: boolean };

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
  const sidePanelCollapsed = useAppSelector(getPaneCollapse);
  const viewMode = useAppSelector(getViewMode);

  return (
    <div className="vertical-panels pr-2">
      <div className="flex h-full flex-row overflow-hidden bg-chrome">
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
  apiKey,
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

  const { value: enableLargeText } = useFeature("enableLargeText");
  usePreferredFontSize(enableLargeText);

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
    let token: Promise<TokenState | void> = Promise.resolve();
    if (isAuthenticated && !isTest()) {
      token = tokenManager.getToken();
    }

    token
      .then(async ts => {
        if (ts?.token) {
          await ThreadFront.setAccessToken(ts.token);
        }

        createSocket(recordingId, ThreadFront);
      })
      .catch(() => {
        console.error("Failed to create session");
      });

    return () => {
      clearTrialExpired();
    };
  }, [isAuthenticated, clearTrialExpired, createSocket, recordingId]);

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
    <SessionContextAdapter apiKey={apiKey ?? null}>
      <SourcesContextAdapter>
        <FocusContextReduxAdapter>
          <PointsContextRoot>
            <TimelineContextAdapter>
              <SelectedFrameContextRoot SelectedFrameContextAdapter={SelectedFrameContextAdapter}>
                <TerminalContextAdapter>
                  <InspectorContextReduxAdapter>
                    <KeyModifiers>
                      <Header />
                      <Body />
                      {showCommandPalette ? <CommandPaletteModal /> : null}
                      <KeyboardShortcuts />
                    </KeyModifiers>
                  </InspectorContextReduxAdapter>
                </TerminalContextAdapter>
              </SelectedFrameContextRoot>
            </TimelineContextAdapter>
          </PointsContextRoot>
        </FocusContextReduxAdapter>
      </SourcesContextAdapter>
    </SessionContextAdapter>
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
