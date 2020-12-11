import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import { useApolloClient, ApolloProvider } from "@apollo/client";
import { gql, useMutation } from "@apollo/client";
import { useAuth0 } from "@auth0/auth0-react";

import DevTools from "./DevTools";
import Account from "./Account";
import Loader from "./shared/Loader";
import { AppErrors, PopupBlockedError } from "./shared/Error";
import SharingModal from "./shared/SharingModal";
import { isDeployPreview } from "ui/utils/environment";
import { setUserInBrowserPrefs } from "ui/utils/browser";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { hasLoadingParam } from "ui/utils/environment";
import ResizeObserverPolyfill from "resize-observer-polyfill";

import "styles.css";

const CREATE_SESSION = gql`
  mutation CreateSession($object: sessions_insert_input!) {
    insert_sessions_one(object: $object) {
      id
      controller_id
      recording_id
    }
  }
`;

function useGetApolloClient() {
  const [apolloClient, setApolloClient] = useState(null);
  const [consentPopupBlocked, setConsentPopupBlocked] = useState(null);

  useApolloClient().then(
    client => {
      // This callback sets the instantiated apolloClient in the App
      // component's state. This makes sure that the App is re-rendered
      // once the apolloClient has been instantiated with createApolloClient.
      if (apolloClient === null && client) {
        setApolloClient(client);
      }
    },
    error => {
      // This lets us know that the user needs to consent to Auth0, but
      // is currently blocking popups.
      if (!consentPopupBlocked && error.message === "Could not open popup") {
        setConsentPopupBlocked(true);
      } else if (error.message !== "Could not open popup") {
        throw error;
      }
    }
  );

  return { apolloClient, consentPopupBlocked };
}

function installViewportObserver({ updateNarrowMode }) {
  const viewport = document.querySelector("body");

  const observer = new ResizeObserverPolyfill(function maybeUpdateNarrowMode() {
    const viewportWidth = viewport.getBoundingClientRect().width;
    updateNarrowMode(viewportWidth);
  });

  observer.observe(viewport);
}

function App({ theme, recordingId, modal, updateNarrowMode, updateUser, sessionId }) {
  const auth = useAuth0();
  const { apolloClient, consentPopupBlocked } = useGetApolloClient();

  const [CreateSession] = useMutation(CREATE_SESSION);

  useEffect(() => {
    setUserInBrowserPrefs(auth.user);
    updateUser(auth.user);
  }, [auth.user]);

  useEffect(() => {
    if (auth.user && sessionId) {
      const object = {
        id: sessionId,
        recording_id: recordingId,
        controller_id: sessionId.split("/")[0],
      };
      CreateSession({ variables: { object } });
    }
  }, [auth.user, sessionId]);

  useEffect(() => {
    document.body.parentElement.className = theme;
    installViewportObserver({ updateNarrowMode });
  }, [theme]);

  if (consentPopupBlocked) {
    return <PopupBlockedError />;
  }

  if ((!isDeployPreview() && auth.isLoading) || !apolloClient || hasLoadingParam()) {
    return <Loader />;
  }

  return (
    <ApolloProvider client={apolloClient}>
      {recordingId ? <DevTools /> : <Account />}
      {modal?.type === "sharing" ? <SharingModal /> : null}
      <AppErrors />
    </ApolloProvider>
  );
}

export default connect(
  state => ({
    theme: selectors.getTheme(state),
    recordingId: selectors.getRecordingId(state),
    modal: selectors.getModal(state),
    sessionId: selectors.getSessionId(state),
  }),
  {
    updateNarrowMode: actions.updateNarrowMode,
    updateUser: actions.updateUser,
  }
)(App);
