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
import { setTelemetryContext } from "ui/utils/telemetry";
import { bootIntercom } from "ui/utils/intercom";
import { setUserInBrowserPrefs, setAccessTokenInBrowserPrefs } from "ui/utils/browser";
import { UIState } from "ui/state";
import { ModalType, UnexpectedError } from "ui/state/app";
import { useGetUserInfo } from "ui/hooks/users";
import { useGetUserSettings } from "ui/hooks/settings";
import useToken from "ui/utils/useToken";

import "./App.css";
import UploadingScreen from "./UploadingScreen";
import TeamMemberOnboardingModal from "./shared/OnboardingModal/TeamMemberOnboardingModal";
import TeamLeaderOnboardingModal from "./shared/TeamLeaderOnboardingModal";
import { useApolloClient } from "@apollo/client";
import BlankScreen from "./shared/BlankScreen";
import { setUnexpectedError } from "ui/actions/session";
import FirstReplayModal from "./shared/FirstReplayModal";
import TOSScreen, { LATEST_TOS_VERSION } from "./TOSScreen";
import SingleInviteModal from "./shared/OnboardingModal/SingleInviteModal";
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
    case "single-invite": {
      return <SingleInviteModal />;
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
  modal,
  setFontLoading,
  setUnexpectedError,
  setWorkspaceId,
  children,
}: AppProps) {
  const auth = useAuth0();
  const userInfo = useGetUserInfo();
  const apolloError = useCheckForApolloError();
  const tokenInfo = useToken();
  const { userSettings, loading: settingsLoading } = useGetUserSettings();

  useEffect(() => {
    if (auth.isAuthenticated) {
      bootIntercom({ email: auth.user.email });
    }
  }, [auth.isAuthenticated]);

  useEffect(() => {
    if (userSettings) {
      setWorkspaceId(userSettings.defaultWorkspaceId);
    }
  }, [userSettings]);

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
      setTelemetryContext(userInfo);
    }
  }, [userInfo]);

  useEffect(() => {
    document.body.parentElement!.className = theme || "";
  }, [theme]);

  useEffect(() => {
    if (!tokenInfo.loading && !tokenInfo.error) {
      setAccessTokenInBrowserPrefs(typeof tokenInfo.token === "string" ? tokenInfo.token : null);
    }
  }, [tokenInfo]);

  useEffect(() => {
    setUserInBrowserPrefs(auth.user);
  }, [auth.user]);

  if (apolloError) {
    return <BlankScreen />;
  }

  if (hasLoadingParam()) {
    return <UploadingScreen />;
  }

  if (!isDeployPreview() && (auth.isLoading || userInfo.loading || settingsLoading)) {
    return <BlankScreen background="white" />;
  }

  if (!isTest() && auth.isAuthenticated && userInfo.acceptedTOSVersion !== LATEST_TOS_VERSION) {
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
    setFontLoading: actions.setFontLoading,
    setUnexpectedError,
    setWorkspaceId: actions.setWorkspaceId,
  }
);
export type AppProps = ConnectedProps<typeof connector> & { children: ReactNode };

export default connector(App);
