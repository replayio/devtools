import React, { useState, useEffect } from "react";
import { connect, ConnectedProps } from "react-redux";
import { useAuth0 } from "@auth0/auth0-react";

import DevTools from "./DevTools";
const Account = require("./Account").default;
const { AppErrors } = require("./shared/Error");
const LoginModal = require("./shared/LoginModal").default;
const SkeletonLoader = require("ui/components/SkeletonLoader").default;
const SharingModal = require("./shared/SharingModal").default;
import NewWorkspaceModal from "./shared/NewWorkspaceModal";
import SettingsModal from "./shared/SettingsModal/index";
import { isDeployPreview } from "ui/utils/environment";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { hasLoadingParam } from "ui/utils/environment";
import ResizeObserverPolyfill from "resize-observer-polyfill";
import LogRocket from "ui/utils/logrocket";

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

function App({ theme, recordingId, modal, updateNarrowMode }: AppProps) {
  const auth = useAuth0();

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
