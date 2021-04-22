import React, { useState, useEffect } from "react";
import mixpanel from "mixpanel-browser";
import * as Sentry from "@sentry/react";
import { connect, ConnectedProps } from "react-redux";
import useAuth0 from "ui/utils/useAuth0";
import { gql, useQuery } from "@apollo/client";

import DevTools from "./DevTools";
const Account = require("./Account").default;
const { AppErrors } = require("./shared/Error");
const LoginModal = require("./shared/LoginModal").default;
const SkeletonLoader = require("ui/components/SkeletonLoader").default;
import SharingModal from "./shared/SharingModal";
import NewWorkspaceModal from "./shared/NewWorkspaceModal";
import WorkspaceSettingsModal from "./shared/WorkspaceSettingsModal";
import SettingsModal from "./shared/SettingsModal/index";
import { isDeployPreview, isTest, hasLoadingParam } from "ui/utils/environment";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import ResizeObserverPolyfill from "resize-observer-polyfill";
import LogRocket from "ui/utils/logrocket";
import hooks from "ui/hooks";
import { setUserInBrowserPrefs } from "ui/utils/browser";
import { UIState } from "ui/state";
import { ModalType } from "ui/state/app";
import useToken from "ui/utils/useToken";
var FontFaceObserver = require("fontfaceobserver");
import "styles.css";

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

function setTelemetryContext(userId: string | undefined, userEmail: string | undefined) {
  let sentryContext: Record<string, string> = {};
  if (userId) {
    mixpanel.identify(userId);
    sentryContext["userId"] = userId;
  }

  if (userEmail) {
    mixpanel.people.set({ $email: userEmail });
    sentryContext["userEmail"] = userEmail;
  }

  Sentry.setContext("user", sentryContext);
}

const GET_USER = gql`
  query GetUserMetadata($userId: uuid!) {
    users(where: { id: { _eq: $userId } }) {
      email
      internal
      name
    }
  }
`;

type UserData = {
  email: string;
  internal: boolean;
  name: string;
};

function App({ theme, recordingId, modal, updateNarrowMode }: AppProps) {
  const auth = useAuth0();
  const { claims } = useToken();

  const userId = claims?.hasura.userId;
  let userData: UserData | null = null;

  const { data } = useQuery<UserData>(GET_USER, {
    variables: { userId },
  });
  if (data) {
    userData = data;
  }
  setTelemetryContext(claims?.hasura.userId, userData?.email);
  const { loading } = hooks.useMaybeClaimInvite();
  const [fontLoading, setFontLoading] = useState(true);

  useEffect(() => {
    var font = new FontFaceObserver("Material Icons");

    font.load().then(() => {
      setFontLoading(false);
    });

    // FontFaceObserver doesn't work in e2e tests.
    if (isTest()) {
      setFontLoading(false);
    }
  }, []);

  useEffect(() => {
    document.body.parentElement!.className = theme || "";
    installViewportObserver({ updateNarrowMode });
  }, [theme]);

  useEffect(() => {
    setUserInBrowserPrefs(auth.user);
    if (auth.user && !userData?.internal) {
      LogRocket.createSession(auth);
    }
  }, [auth.user]);

  if (hasLoadingParam()) {
    return <SkeletonLoader content={"Uploading resources"} />;
  }

  if (loading || fontLoading) {
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
