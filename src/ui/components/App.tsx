import React, { useEffect } from "react";
import { connect, ConnectedProps } from "react-redux";

const DevTools = require("./DevTools").default;
const { Account } = require("./Account");
const { AppErrors } = require("./shared/Error");
const SharingModal = require("./shared/SharingModal").default;
const LoginModal = require("./shared/LoginModal").default;
import WelcomePage from "./Welcome";
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
import { Route, Switch, useHistory, useLocation } from "react-router-dom";
import { Location } from "history";
import { SignIn, withClerk, WithClerkProp } from "@clerk/clerk-react";
import Auth from "./Auth";

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

interface HistoryState {
  modal?: boolean;
  previous?: Location<HistoryState>;
}

function App({ clerk, theme, recordingId, modal, updateNarrowMode }: WithClerkProp<AppProps>) {
  const location = useLocation<HistoryState>();

  useEffect(() => {
    document.body.parentElement!.className = theme || "";
    installViewportObserver({ updateNarrowMode });
  }, [theme]);

  useEffect(() => {
    setUserInBrowserPrefs(clerk.user);
    if (clerk.user) {
      LogRocket.createSession(clerk.user);
    }
  }, [clerk.user]);

  if (hasLoadingParam()) {
    return <Uploading />;
  }

  // TODO: Clerk.dev
  if (!isDeployPreview() && !clerk) {
    return null;
  }

  let switchLocation = location;
  if (location.state?.modal && location.state?.previous) {
    switchLocation = location.state.previous;
  }

  return (
    <>
      <Switch location={switchLocation}>
        <Route path="/view?id=:id" exact>
          <DevTools />
        </Route>
        <Route path="/view" exact>
          <WelcomePage />
        </Route>
        <Route path="*">
          <Account />
        </Route>
      </Switch>
      {location.state?.modal ? (
        <Switch>
          <Route path={["/sign-in", "/sign-up"]}>
            <Auth />
          </Route>
        </Switch>
      ) : null}
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

export default connector(withClerk(App));
