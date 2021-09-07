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
import { useGetUserInfo } from "ui/hooks/users";

import "./App.css";
import TeamMemberOnboardingModal from "./shared/OnboardingModal/TeamMemberOnboardingModal";
import TeamLeaderOnboardingModal from "./shared/TeamLeaderOnboardingModal";
import { LoadingScreen } from "./shared/BlankScreen";
import FirstReplayModal from "./shared/FirstReplayModal";
import TOSScreen, { LATEST_TOS_VERSION } from "./TOSScreen";
import SingleInviteModal from "./shared/OnboardingModal/SingleInviteModal";

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

function App({ theme, modal, children }: AppProps) {
  const auth = useAuth0();
  const userInfo = useGetUserInfo();

  useEffect(() => {
    document.body.parentElement!.className = theme || "";
  }, [theme]);

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
    <>
      {children}
      {modal ? <AppModal modal={modal} /> : null}
      <AppErrors />
    </>
  );
}

const connector = connect((state: UIState) => ({
  theme: selectors.getTheme(state),
  modal: selectors.getModal(state),
}));
export type AppProps = ConnectedProps<typeof connector> & { children: ReactNode };

export default connector(App);
