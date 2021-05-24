import React, { useEffect } from "react";
import { connect, ConnectedProps } from "react-redux";
import useAuth0 from "ui/utils/useAuth0";

const Account = require("./Account").default;
import AppErrors from "./shared/Error";
const LoginModal = require("./shared/LoginModal").default;
import SharingModal from "./shared/SharingModal";
import NewWorkspaceModal from "./shared/NewWorkspaceModal";
import WorkspaceSettingsModal from "./shared/WorkspaceSettingsModal";
import SettingsModal from "./shared/SettingsModal/index";
import OnboardingModal from "./shared/OnboardingModal/index";
import { isDeployPreview, isTest, hasLoadingParam } from "ui/utils/environment";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import ResizeObserverPolyfill from "resize-observer-polyfill";
import LogRocket from "ui/utils/logrocket";
import { setTelemetryContext } from "ui/utils/telemetry";
import { setUserInBrowserPrefs } from "ui/utils/browser";
import { UIState } from "ui/state";
import { ModalType } from "ui/state/app";
import useToken from "ui/utils/useToken";
import { useGetUserInfo } from "ui/hooks/users";
import { useGetRecording } from "ui/hooks/recordings";

import "styles.css";
import UploadingScreen from "./UploadingScreen";
import DevToolsLoader from "./DevToolsLoader";
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

function App({ theme, recordingId, modal, updateNarrowMode, setFontLoading }: AppProps) {
  const auth = useAuth0();
  const { claims } = useToken();
  const userInfo = useGetUserInfo();
  const recordingInfo = useGetRecording(recordingId);

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
      setTelemetryContext(claims?.hasura.userId, userInfo.email, userInfo.internal);
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

  if (hasLoadingParam()) {
    return <UploadingScreen />;
  }

  if (!isDeployPreview() && auth.isLoading) {
    return null;
  }

  return (
    <>
      {recordingId ? <DevToolsLoader recordingId={recordingId} /> : <Account />}
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
  }
);
export type AppProps = ConnectedProps<typeof connector>;

export default connector(App);
