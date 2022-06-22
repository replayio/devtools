import { Object } from "@replayio/protocol";
import { Pause, ThreadFront } from "protocol/thread";
import React, { useEffect, useState, useRef, useMemo, useContext } from "react";
import { connect, ConnectedProps } from "react-redux";
import { useAppSelector } from "ui/setup/hooks";
import { clearTrialExpired, createSocket } from "ui/actions/session";
import { useGetRecording, useGetRecordingId } from "ui/hooks/recordings";
import { UIState } from "ui/state";

import { selectors } from "../reducers";

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
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { preCacheObject } from "bvaughn-architecture-demo/src/suspense/ObjectPreviews";
import { stringify } from "bvaughn-architecture-demo/src/utils/string";

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
  clearTrialExpired,
  createSocket,
  loadingFinished,
  sessionId,
  showCommandPalette,
  uploadComplete,
}: _DevToolsProps) {
  const { isAuthenticated } = useAuth0();
  const recordingId = useGetRecordingId();
  const { recording } = useGetRecording(recordingId);
  const { trackLoadingIdleTime } = useTrackLoadingIdleTime(uploadComplete, recording);
  const { userIsAuthor, loading } = useUserIsAuthor();
  const isExternalRecording = useMemo(
    () => recording?.user && !recording.user.internal,
    [recording]
  );

  // Wire up the ReplayClient used for the new Object Inspector component.
  const replayClient = useContext(ReplayClientContext);
  useEffect(() => {
    async function initSession() {
      const sessionId = await ThreadFront.waitForSession();
      replayClient.configure(sessionId!);
    }
    initSession();
  }, [replayClient]);

  // HACK
  // Pass data (from Pause) through to the Suspense cache used by the Object Inspector.
  // This is required because the new ReplayClient isn't being used to fetch the data.
  useEffect(() => {
    const set = new Set<Object>();

    let currentPause: Pause | null = null;

    function onPauseObjects(objects: Object[]) {
      const pauseId = currentPause!.pauseId!;

      objects.forEach((object: Object) => {
        if (!set.has(object)) {
          set.add(object);

          // Deeply clone object data before pre-caching it.
          // The Pause class mutates these values by adding ValueFronts to them.
          preCacheObject(pauseId, JSON.parse(stringify(object)));
        }
      });
    }

    async function onThreadCurrentPause(pause: Pause | null) {
      if (currentPause !== null) {
        currentPause.off("objects", onPauseObjects);
      }

      currentPause = pause;

      if (pause != null) {
        pause.on("objects", onPauseObjects);
      }
    }

    ThreadFront.on("currentPause", onThreadCurrentPause);

    return () => {
      ThreadFront.off("currentPause", onThreadCurrentPause);

      if (currentPause !== null) {
        currentPause.off("objects", onPauseObjects);
      }
    };
  }, []);

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
  }, [clearTrialExpired, createSocket, recordingId, replayClient]);

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

type DevToolsProps = { uploadComplete: boolean };
const DevTools = (props: DevToolsProps) => (
  <WaitForReduxSlice slice="messages">
    <ConnectedDevTools {...props} />
  </WaitForReduxSlice>
);

export default DevTools;
