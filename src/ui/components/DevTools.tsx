import Head from "next/head";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ConnectedProps, connect } from "react-redux";
import {
  ImperativePanelHandle,
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";

import InspectorContextReduxAdapter from "devtools/client/debugger/src/components/shared/InspectorContextReduxAdapter";
import { ThreadFront } from "protocol/thread";
import { ExpandablesContextRoot } from "replay-next/src/contexts/ExpandablesContext";
import { PointsContextRoot } from "replay-next/src/contexts/points/PointsContext";
import { SelectedFrameContextRoot } from "replay-next/src/contexts/SelectedFrameContext";
import usePreferredFontSize from "replay-next/src/hooks/usePreferredFontSize";
import { useGraphQLUserData } from "shared/user-data/GraphQL/useGraphQLUserData";
import { userData } from "shared/user-data/GraphQL/UserData";
import { clearTrialExpired, createSocket } from "ui/actions/session";
import TerminalContextAdapter from "ui/components/SecondaryToolbox/TerminalContextAdapter";
import { TestSuiteContextRoot } from "ui/components/TestSuite/views/TestSuiteContext";
import { useGetRecording, useGetRecordingId } from "ui/hooks/recordings";
import { useTrackLoadingIdleTime } from "ui/hooks/tracking";
import { useUserIsAuthor } from "ui/hooks/users";
import { getViewMode } from "ui/reducers/layout";
import { useAppSelector } from "ui/setup/hooks";
import { UIState } from "ui/state";
import {
  endUploadWaitTracking,
  maybeSetGuestMixpanelContext,
  trackEventOnce,
} from "ui/utils/mixpanel";
import tokenManager, { TokenState } from "ui/utils/tokenManager";
import useAuth0 from "ui/utils/useAuth0";

import { selectors } from "../reducers";
import { CommandPaletteModal } from "./CommandPalette/CommandPaletteModal";
import FocusContextReduxAdapter from "./FocusContextReduxAdapter";
import Header from "./Header/index";
import KeyboardShortcuts from "./KeyboardShortcuts";
import { KeyModifiers } from "./KeyModifiers";
import LayoutContextAdapter from "./LayoutContextAdapter";
import TimelineContextAdapter from "./SecondaryToolbox/TimelineContextAdapter";
import SelectedFrameContextAdapter from "./SelectedFrameContextAdapter";
import SessionContextAdapter from "./SessionContextAdapter";
import LoadingScreen from "./shared/LoadingScreen";
import ReplayLogo from "./shared/ReplayLogo";
import SidePanel from "./SidePanel";
import SourcesContextAdapter from "./SourcesContextAdapter";
import Timeline from "./Timeline/Timeline";
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
  const viewMode = useAppSelector(getViewMode);

  const sidePanelRef = useRef<ImperativePanelHandle>(null);

  const [sidePanelCollapsed, setSidePanelCollapsed] = useGraphQLUserData("sidePanelCollapsed");

  const onSidePanelCollapse = (isCollapsed: boolean) => {
    setSidePanelCollapsed(isCollapsed);
  };

  useEffect(() => {
    if (sidePanelCollapsed) {
      sidePanelRef.current?.collapse();
    } else {
      sidePanelRef.current?.expand();
    }
  }, [sidePanelCollapsed]);

  return (
    <div className="vertical-panels pr-2">
      <div className="flex h-full flex-row overflow-hidden bg-chrome">
        <Toolbar />
        <PanelGroup autoSaveId="DevTools-horizontal" className="split-box" direction="horizontal">
          <Panel
            className="flex=1 flex h-full overflow-hidden"
            collapsible
            defaultSize={20}
            id="Panel-SidePanel"
            minSize={15}
            onCollapse={onSidePanelCollapse}
            ref={sidePanelRef}
          >
            <SidePanel />
          </Panel>
          <PanelResizeHandle
            className={`h-full ${sidePanelCollapsed ? "w-0" : "w-2"}`}
            id="PanelResizeHandle-SidePanel"
          />
          <Panel className="flex h-full overflow-hidden" minSize={50}>
            {viewMode === "dev" ? (
              <React.Suspense fallback={<ViewLoader />}>
                <Viewer />
              </React.Suspense>
            ) : (
              <Video />
            )}
          </Panel>
        </PanelGroup>
      </div>
      <Timeline />
    </div>
  );
}

function _DevTools({
  apiKey,
  clearTrialExpired,
  createSocket,
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

  const [enableLargeText] = useGraphQLUserData("enableLargeText");

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
    // Preferences cache always initializes itself from localStorage
    // For authenticated users, this method will fetch remote preferences and merge via into the cache.
    userData.initialize(isAuthenticated);
  }, [isAuthenticated]);

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
    if (isAuthenticated) {
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

  if (!loadingFinished) {
    return <LoadingScreen fallbackMessage="Loading..." />;
  }

  const title = recording?.title;

  return (
    <SessionContextAdapter apiKey={apiKey ?? null}>
      <SourcesContextAdapter>
        <FocusContextReduxAdapter>
          <PointsContextRoot>
            <TimelineContextAdapter>
              <TestSuiteContextRoot>
                <SelectedFrameContextRoot SelectedFrameContextAdapter={SelectedFrameContextAdapter}>
                  <TerminalContextAdapter>
                    <InspectorContextReduxAdapter>
                      <ExpandablesContextRoot>
                        <LayoutContextAdapter>
                          <KeyModifiers>
                            {title && (
                              <Head>
                                <title>{title}</title>
                              </Head>
                            )}
                            <Header />
                            <Body />
                            {showCommandPalette ? <CommandPaletteModal /> : null}
                            <KeyboardShortcuts />
                          </KeyModifiers>
                        </LayoutContextAdapter>
                      </ExpandablesContextRoot>
                    </InspectorContextReduxAdapter>
                  </TerminalContextAdapter>
                </SelectedFrameContextRoot>
              </TestSuiteContextRoot>
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
