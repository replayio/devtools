import React, { ReactNode, useEffect } from "react";
import { connect, ConnectedProps } from "react-redux";
import useAuth0 from "ui/utils/useAuth0";

import AppErrors from "./shared/Error";
import LoginModal from "./shared/LoginModal";
import SharingModal from "./shared/SharingModal";
import LaunchBrowserModal from "./shared/LaunchBrowserModal";
import NewWorkspaceModal from "./shared/NewWorkspaceModal";
import WorkspaceSettingsModal from "./shared/WorkspaceSettingsModal";
import SettingsModal from "./shared/SettingsModal/index";
import OnboardingModal from "./shared/OnboardingModal/index";
import { isDeployPreview, isTest, hasLoadingParam } from "ui/utils/environment";
import * as selectors from "ui/reducers/app";
import * as actions from "ui/actions/app";
import ResizeObserverPolyfill from "resize-observer-polyfill";
import LogRocket from "ui/utils/logrocket";
import { setTelemetryContext } from "ui/utils/telemetry";
import { setUserInBrowserPrefs } from "ui/utils/browser";
import { UIState } from "ui/state";
import { ModalType, UnexpectedError } from "ui/state/app";
import { useGetUserInfo } from "ui/hooks/users";
import { useGetRecording } from "ui/hooks/recordings";

import "styles.css";
import UploadingScreen from "./UploadingScreen";
import TeamMemberOnboardingModal from "./shared/OnboardingModal/TeamMemberOnboardingModal";
import TeamLeaderOnboardingModal from "./shared/TeamLeaderOnboardingModal";
import { useApolloClient } from "@apollo/client";
import BlankScreen from "./shared/BlankScreen";
import { setUnexpectedError } from "ui/actions/session";
import FirstReplayModal from "./shared/FirstReplayModal";
import TOSScreen, { LATEST_TOS_VERSION } from "./TOSScreen";
var FontFaceObserver = require("fontfaceobserver");

function AppModal({ modal }: { modal: ModalType }) {
  switch (modal) {
    case "sharing": {
      return <SharingModal />;
    }
    case "login": {
      return <LoginModal />;
    }
    case "settings": {
      return <SettingsModal />;
    }
    case "new-workspace": {
      return <NewWorkspaceModal />;
    }
    case "workspace-settings": {
      return <WorkspaceSettingsModal />;
    }
    case "onboarding": {
      return <OnboardingModal />;
    }
    case "team-member-onboarding": {
      return <TeamMemberOnboardingModal />;
    }
    case "team-leader-onboarding": {
      return <TeamLeaderOnboardingModal />;
    }
    case "browser-launch": {
      return <LaunchBrowserModal />;
    }
    case "first-replay": {
      return <FirstReplayModal />;
    }
    default: {
      return null;
    }
  }
}

function installViewportObserver({ updateNarrowMode }: Pick<AppProps, "updateNarrowMode">) {
  const viewport = document.querySelector("body");

  const observer = new ResizeObserverPolyfill(function maybeUpdateNarrowMode() {
    const viewportWidth = viewport!.getBoundingClientRect().width;
    updateNarrowMode(viewportWidth);
  });

  observer.observe(viewport!);
}

function useCheckForApolloError() {
  const client = useApolloClient();

  if (!client) {
    const error: UnexpectedError = {
      message: "Database error",
      content:
        "We seem to be having problems connecting to the database. Please refresh this page and try again.",
      action: "refresh",
    };

    return error;
  }

  return null;
}

function App({
  theme,
  recordingId,
  modal,
  updateNarrowMode,
  setFontLoading,
  setUnexpectedError,
  children,
}: AppProps) {
  const auth = useAuth0();
  const userInfo = useGetUserInfo();
  const { isAuthenticated } = useAuth0();
  const recordingInfo = useGetRecording(recordingId);
  const apolloError = useCheckForApolloError();

  useEffect(() => {
    if (apolloError) {
      setUnexpectedError(apolloError);
    }
  }, [apolloError]);

  useEffect(() => {
    var font = new FontFaceObserver("Material Icons");
    font.load().then(() => setFontLoading(false));

    // FontFaceObserver doesn't work in e2e tests.
    if (isTest()) {
      setFontLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userInfo.loading) {
      setTelemetryContext(userInfo.id, userInfo.email, userInfo.internal);
    }
  }, [userInfo]);

  useEffect(() => {
    document.body.parentElement!.className = theme || "";
    installViewportObserver({ updateNarrowMode });
  }, [theme]);

  useEffect(() => {
    setUserInBrowserPrefs(auth.user);
  }, [auth.user]);

  useEffect(() => {
    if (!recordingInfo.loading && !userInfo.loading && recordingInfo.recording) {
      LogRocket.createSession(recordingInfo.recording, userInfo, auth);
    }
  }, [auth, userInfo, recordingInfo]);

  if (apolloError) {
    return <BlankScreen />;
  }

  if (hasLoadingParam()) {
    return <UploadingScreen />;
  }

  if (!isDeployPreview() && auth.isLoading) {
    return <BlankScreen />;
  }

  if (!isTest() && isAuthenticated && userInfo.acceptedTOSVersion !== LATEST_TOS_VERSION) {
    return <TOSScreen />;
  }

  return (
    <>
      {children}
      {modal ? <AppModal modal={modal} /> : null}
      <AppErrors />
    </>
  );
}

const connector = connect(
  (state: UIState) => ({
    theme: selectors.getTheme(state),
    recordingId: selectors.getRecordingId(state),
    modal: selectors.getModal(state),
    sessionId: selectors.getSessionId(state),
  }),
  {
    updateNarrowMode: actions.updateNarrowMode,
    setFontLoading: actions.setFontLoading,
    setUnexpectedError,
  }
);
export type AppProps = ConnectedProps<typeof connector> & { children: ReactNode };

export default connector(App);
