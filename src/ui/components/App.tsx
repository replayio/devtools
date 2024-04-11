import React, { ReactNode, useEffect } from "react";
import { ConnectedProps, connect } from "react-redux";

import QuickOpenModal from "devtools/client/debugger/src/components/QuickOpenModal";
import { getQuickOpenEnabled } from "devtools/client/debugger/src/selectors";
import { getSystemColorScheme } from "shared/theme/getSystemColorScheme";
import { Theme } from "shared/theme/types";
import { userData } from "shared/user-data/GraphQL/UserData";
import { isTest } from "shared/utils/environment";
import { actions } from "ui/actions";
import { LibrarySpinner } from "ui/components/Library/LibrarySpinner";
import hooks from "ui/hooks";
import { Nag, useGetUserInfo } from "ui/hooks/users";
import { getLoadingFinished, getModal } from "ui/reducers/app";
import { useAppSelector } from "ui/setup/hooks";
import { UIState } from "ui/state";
import { ModalType } from "ui/state/app";
import { trackEvent } from "ui/utils/telemetry";
import { shouldShowNag } from "ui/utils/tour";
import useAuth0 from "ui/utils/useAuth0";

import { ConfirmRenderer } from "./shared/Confirm";
import LoginModal from "./shared/LoginModal";
import LoomModal from "./shared/LoomModal";
import PassportDismissModal from "./shared/Modals/PassportDismissModal";
import RenameReplayModal from "./shared/Modals/RenameReplayModal";
import NewAttachment from "./shared/NewAttachment";
import TOSScreen, { LATEST_TOS_VERSION } from "./TOSScreen";

const LaunchBrowserModal = React.lazy(() => import("./shared/LaunchBrowserModal"));
const NewWorkspaceModal = React.lazy(() => import("./shared/NewWorkspaceModal"));
const WorkspaceSettingsModal = React.lazy(() => import("./shared/WorkspaceSettingsModal"));
const UserSettingsModal = React.lazy(() => import("./shared/UserSettingsModal"));
const SharingModal = React.lazy(() => import("./shared/SharingModal"));
const OnboardingModal = React.lazy(() => import("./shared/OnboardingModal/index"));
const SourcemapSetupModal = React.lazy(() => import("./shared/Modals/SourcemapSetupModal"));
const FirstReplayModal = React.lazy(() => import("./shared/FirstReplayModal"));

function AppModal({ hideModal, modal }: { hideModal: () => void; modal: ModalType }) {
  const loadingFinished = useAppSelector(getLoadingFinished);

  // Dismiss modal if the "Escape" key is pressed.
  useEffect(() => {
    const onDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        hideModal();
      }
    };
    document.addEventListener("keydown", onDocumentKeyDown);
    return () => {
      document.removeEventListener("keydown", onDocumentKeyDown);
    };
  }, [hideModal]);

  if (!loadingFinished) {
    return null;
  }

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
      return <OnboardingModal />;
    }
    case "browser-launch": {
      return <LaunchBrowserModal />;
    }
    case "first-replay": {
      return <FirstReplayModal />;
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
    case "rename-replay": {
      return <RenameReplayModal />;
    }
    case "passport-dismiss": {
      return <PassportDismissModal />;
    }
    default: {
      return null;
    }
  }
}

function App({ children, hideModal, modal, quickOpenEnabled }: AppProps) {
  const auth = useAuth0();
  const dismissNag = hooks.useDismissNag();
  const userInfo = useGetUserInfo();

  useEffect(() => {
    if (userInfo.nags && shouldShowNag(userInfo.nags, Nag.FIRST_LOG_IN)) {
      trackEvent("login.first_log_in");
      dismissNag(Nag.FIRST_LOG_IN);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo.nags]);

  useEffect(() => {
    // Stop space bar from being used as a universal "scroll down" operator
    // We have a big play/pause interface, so space makes way more sense for that.

    const stopCodeMirrorScroll = (e: KeyboardEvent) => {
      if (e.code !== "Space") {
        return;
      }

      if (
        e.target === document.body ||
        (e.target?.hasOwnProperty("classList") &&
          (e.target as Element).classList.contains(".CodeMirror-scroll"))
      ) {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", stopCodeMirrorScroll);
    return () => window.removeEventListener("keydown", stopCodeMirrorScroll);
  }, []);

  useEffect(() => {
    const updateTheme = (theme: Theme) => {
      if (theme === "system") {
        theme = getSystemColorScheme();
      }
      document.body.parentElement!.className = `theme-${theme}`;
    };

    updateTheme(userData.get("global_theme"));

    userData.subscribe("global_theme", updateTheme);
  }, []);

  if (auth.isLoading || userInfo.loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LibrarySpinner />
      </div>
    );
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
      {modal ? (
        <React.Suspense>
          <AppModal hideModal={hideModal} modal={modal} />
        </React.Suspense>
      ) : null}
      {quickOpenEnabled === true && <QuickOpenModal />}
      <ConfirmRenderer />
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({
    modal: getModal(state),

    // Only read quick open state if it exists, to ensure safe loads
    quickOpenEnabled: !!state.quickOpen && getQuickOpenEnabled(state),
  }),
  {
    hideModal: actions.hideModal,
  }
);
export type AppProps = ConnectedProps<typeof connector> & { children?: ReactNode };

export default connector(App);
