import React, { ReactNode, useEffect } from "react";
import { connect, ConnectedProps } from "react-redux";
import useAuth0 from "ui/utils/useAuth0";

import AppErrors from "./shared/Error";
import LoginModal from "./shared/LoginModal";
import SharingModal from "./shared/SharingModal";
import LaunchBrowserModal from "./shared/LaunchBrowserModal";
import NewWorkspaceModal from "./shared/NewWorkspaceModal";
import WorkspaceSettingsModal from "./shared/WorkspaceSettingsModal";
import UserSettingsModal from "./shared/UserSettingsModal";
import OnboardingModal from "./shared/OnboardingModal/index";
import { isDeployPreview, isTest } from "ui/utils/environment";
import * as selectors from "ui/reducers/app";
import { UIState } from "ui/state";
import { ModalType } from "ui/state/app";
import { Nag, useGetUserInfo } from "ui/hooks/users";

import LoadingScreen from "./shared/LoadingScreen";
import FirstReplayModal from "./shared/FirstReplayModal";
import TOSScreen, { LATEST_TOS_VERSION } from "./TOSScreen";
import SingleInviteModal from "./shared/OnboardingModal/SingleInviteModal";
import TrimmingModal from "./shared/TrimmingModal/TrimmingModal";
import { migratePrefToSettings } from "ui/hooks/settings";
import { ConfirmRenderer } from "./shared/Confirm";
import PrivacyModal from "./shared/PrivacyModal";
import LoomModal from "./shared/LoomModal";
import NewAttachment from "./shared/NewAttachment";
import DownloadReplayPromptModal from "./shared/OnboardingModal/DownloadReplayPromptModal";
import hooks from "ui/hooks";
import { shouldShowNag } from "ui/utils/user";
import { trackEvent } from "ui/utils/telemetry";
import SourcemapSetupModal from "./shared/Modals/SourcemapSetupModal";

function AppModal({ modal }: { modal: ModalType }) {
  switch (modal) {
    case "sharing": {
      return <SharingModal />;
    }
    case "login": {
      return <LoginModal />;
    }
    case "settings": {
      return <UserSettingsModal />;
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
    case "single-invite": {
      return <SingleInviteModal />;
    }
    case "browser-launch": {
      return <LaunchBrowserModal />;
    }
    case "first-replay": {
      return <FirstReplayModal />;
    }
    case "download-replay": {
      return <DownloadReplayPromptModal />;
    }
    case "trimming": {
      return <TrimmingModal />;
    }
    case "privacy": {
      return <PrivacyModal />;
    }
    case "loom": {
      return <LoomModal />;
    }
    case "attachment": {
      return <NewAttachment />;
    }
    case "sourcemap-setup": {
      return <SourcemapSetupModal />;
    }
    default: {
      return null;
    }
  }
}

function App({ children, modal, theme }: AppProps) {
  const auth = useAuth0();
  const dismissNag = hooks.useDismissNag();
  const userInfo = useGetUserInfo();

  useEffect(() => {
    if (userInfo.nags && shouldShowNag(userInfo.nags, Nag.FIRST_LOG_IN)) {
      trackEvent("login.first_log_in");
      dismissNag(Nag.FIRST_LOG_IN);
    }
  }, [userInfo.nags]);

  useEffect(() => {
    // Stop space bar from being used as a universal "scroll down" operator
    // We have a big play/pause interface, so space makes way more sense for that.
    window.addEventListener("keydown", function (e) {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
      }
    });
  });

  useEffect(() => {
    document.body.parentElement!.className = theme || "";
  }, [theme]);

  useEffect(() => {
    if (!isTest() && auth.isAuthenticated) {
      migratePrefToSettings("devtools.disableLogRocket", "disableLogRocket");
    }
  }, [auth.isAuthenticated]);

  if (!isDeployPreview() && (auth.isLoading || userInfo.loading)) {
    return <LoadingScreen />;
  }

  if (
    !isTest() &&
    auth.isAuthenticated &&
    userInfo.acceptedTOSVersion &&
    userInfo.acceptedTOSVersion !== LATEST_TOS_VERSION
  ) {
    return <TOSScreen />;
  }

  return (
    <div id="app-container">
      {children}
      {modal ? <AppModal modal={modal} /> : null}
      <ConfirmRenderer />
      <AppErrors />
    </div>
  );
}

const connector = connect((state: UIState) => ({
  modal: selectors.getModal(state),
  theme: selectors.getTheme(state),
}));
export type AppProps = ConnectedProps<typeof connector> & { children: ReactNode };

export default connector(App);
