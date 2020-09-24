import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import DevTools from "./DevTools";
import { Account } from "./Account/index";
import Loader from "./shared/Loader";
import Error from "./shared/Error";
import { selectors } from "../reducers";
import { useApolloClient, ApolloProvider } from "@apollo/client";
import { useAuth0 } from "@auth0/auth0-react";

import "styles.css";

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

function App({ theme, recordingId }) {
  const { isAuthenticated, isLoading } = useAuth0();
  const { apolloClient, consentPopupBlocked } = useGetApolloClient();

  useEffect(() => {
    document.body.parentElement.className = theme;
  }, [theme]);

  if (consentPopupBlocked) {
    return <Error />;
  }

  if (isLoading || (isAuthenticated && !apolloClient)) {
    return <Loader />;
  }

  return (
    <ApolloProvider client={apolloClient}>
      {recordingId ? <DevTools /> : <Account />}
    </ApolloProvider>
  );
}

export default connect(
  state => ({
    theme: selectors.getTheme(state),
    recordingId: selectors.getRecordingId(state),
  }),
  {}
)(App);
