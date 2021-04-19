import React, { useEffect } from "react";
import mixpanel from "mixpanel-browser";
import * as Sentry from "@sentry/react";
import { connect, ConnectedProps } from "react-redux";
import useAuth0 from "ui/utils/useAuth0";

import DevTools from "./DevTools";
const Account = require("./Account").default;
const { AppErrors } = require("./shared/Error");
const LoginModal = require("./shared/LoginModal").default;
const SkeletonLoader = require("ui/components/SkeletonLoader").default;
import SharingModal from "./shared/SharingModal";
import NewWorkspaceModal from "./shared/NewWorkspaceModal";
import WorkspaceSettingsModal from "./shared/WorkspaceSettingsModal";
import SettingsModal from "./shared/SettingsModal/index";
import { isDeployPreview, skipTelemetry } from "ui/utils/environment";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { hasLoadingParam } from "ui/utils/environment";
import ResizeObserverPolyfill from "resize-observer-polyfill";
import LogRocket from "ui/utils/logrocket";
import hooks from "ui/hooks";

import "styles.css";
import { setUserInBrowserPrefs } from "ui/utils/browser";
import { UIState } from "ui/state";
import { ModalType } from "ui/state/app";

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

function setTelemetryContext(userEmail: string) {
  mixpanel.register({ userEmail });
  Sentry.setContext("user", { userEmail });
}

function App({ theme, recordingId, modal, updateNarrowMode }: AppProps) {
  const auth = useAuth0();
  setTelemetryContext(auth.user?.email);
  const { loading } = hooks.useMaybeClaimInvite();

  useEffect(() => {
    document.body.parentElement!.className = theme || "";
    installViewportObserver({ updateNarrowMode });
  }, [theme]);

  useEffect(() => {
    setUserInBrowserPrefs(auth.user);
    if (auth.user) {
      LogRocket.createSession(auth);
    }
  }, [auth.user]);

  if (hasLoadingParam()) {
    return <SkeletonLoader content={"Uploading resources"} />;
  }

  if (loading) {
    return <SkeletonLoader content={"Loading"} />;
  }

  if (!isDeployPreview() && auth.isLoading) {
    return null;
  }

  return (
    <>
      {recordingId ? <DevTools recordingId={recordingId} /> : <Account />}
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
  }
);
export type AppProps = ConnectedProps<typeof connector>;

export default connector(App);
