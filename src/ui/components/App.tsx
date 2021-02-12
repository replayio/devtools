import React, { useEffect } from "react";
import { connect, ConnectedProps } from "react-redux";

const DevTools = require("./DevTools").default;
const { Account, WelcomePage } = require("./Account");
const { AppErrors } = require("./shared/Error");
const SharingModal = require("./shared/SharingModal").default;
const LoginModal = require("./shared/LoginModal").default;
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
import { Uploading } from "./Uploading";
import useAuth from "ui/utils/auth/useAuth";
import { Route, Switch } from "react-router-dom";

function AppModal({ modal }: { modal: ModalType }) {
  switch (modal) {
    case "sharing": {
      return <SharingModal />;
    }
    case "login": {
      return <LoginModal />;
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
  const { user } = useAuth();

  useEffect(() => {
    document.body.parentElement!.className = theme || "";
    installViewportObserver({ updateNarrowMode });
  }, [theme]);

  useEffect(() => {
    setUserInBrowserPrefs(user);
    if (user) {
      LogRocket.createSession(user);
    }
  }, [user]);

  if (hasLoadingParam()) {
    return <Uploading />;
  }

  // TODO: Clerk.dev
  // if (!isDeployPreview() && auth?.isLoading) {
  //   return null;
  // }

  return (
    <>
      <Switch>
        <Route path="/view?id=:id" exact>
          <DevTools />
        </Route>
        <Route path={["/view", "/sign-up", "/sign-in"]} exact>
          <WelcomePage />
        </Route>
        <Route path="*">
          <Account />
        </Route>
      </Switch>
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
