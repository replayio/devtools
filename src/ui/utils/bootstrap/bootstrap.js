import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";
import { Auth0Context } from "@auth0/auth0-react";

import * as Sentry from "@sentry/react";
import { Integrations } from "@sentry/apm";

import App from "ui/components/App";
import Auth0ProviderWithHistory from "ui/utils/auth0";
import LogRocket from "ui/utils/logrocket";
import { createApolloClient, getToken } from "ui/utils/apolloClient";
import { ApolloProvider } from "@apollo/client";
import { defer } from "protocol/utils";

import { isDevelopment, isTest } from "../environment";
const skipTelemetry = isTest() || isDevelopment();

function setupLogRocket() {
  if (skipTelemetry) {
    return;
  }

  LogRocket.init("4sdo4i/replay");
  LogRocket.getSessionURL(sessionURL => {
    Sentry.configureScope(scope => {
      scope.setExtra("sessionURL", sessionURL);
    });
  });
}

export function setupSentry(context) {
  const ignoreList = ["Current thread has paused or resumed", "Current thread has changed"];

  if (skipTelemetry) {
    return;
  }

  Sentry.init({
    dsn: "https://41c20dff316f42fea692ef4f0d055261@o437061.ingest.sentry.io/5399075",
    integrations: [new Integrations.Tracing()],
    tracesSampleRate: 1.0,
    beforeSend(event) {
      if (event) {
        const exceptionValue = event?.exception.values[0].value;
        if (ignoreList.some(ignore => exceptionValue.includes(ignore))) {
          return null;
        }
      }

      return event;
    },
  });

  Sentry.setContext("recording", { ...context, url: window.location.href });
}

export async function bootstrapApp(props, context, store) {
  setupSentry(context);
  setupLogRocket();

  const deferredToken = defer();
  let isTokenReceived = false;
  async function checkForToken(auth0Client) {
    if (isTokenReceived || auth0Client.isLoading) {
      return;
    }
    if (auth0Client.isAuthenticated) {
      const token = await getToken(auth0Client);
      deferredToken.resolve(token);
    } else {
      deferredToken.resolve(undefined);
    }
    isTokenReceived = true;
  }

  ReactDOM.render(
    <Router>
      <Auth0ProviderWithHistory>
        <Auth0Context.Consumer>
          {auth0Client => {
            checkForToken(auth0Client);
            return (
              <ApolloProvider client={createApolloClient(auth0Client)}>
                <Provider store={store}>{React.createElement(App, props)}</Provider>
              </ApolloProvider>
            );
          }}
        </Auth0Context.Consumer>
      </Auth0ProviderWithHistory>
    </Router>,
    document.querySelector("#app")
  );

  return deferredToken.promise;
}
