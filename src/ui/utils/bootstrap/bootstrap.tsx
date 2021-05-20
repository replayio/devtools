import React, { ReactNode } from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";

import * as Sentry from "@sentry/react";
import { Integrations } from "@sentry/tracing";

import mixpanel from "mixpanel-browser";

import App, { AppProps } from "ui/components/App";
import { PopupBlockedError } from "ui/components/shared/Error";
import tokenManager from "ui/utils/tokenManager";
import useToken from "ui/utils/useToken";
import { createApolloClient } from "ui/utils/apolloClient";
import { ApolloProvider } from "@apollo/client";

import { skipTelemetry } from "../environment";
import { UIStore } from "ui/actions";
import { BlankLoadingScreen } from "ui/components/shared/BlankScreen";

export function setupTelemetry(context: Record<string, any>) {
  const ignoreList = ["Current thread has paused or resumed", "Current thread has changed"];
  mixpanel.init("ffaeda9ef8fb976a520ca3a65bba5014");

  if (skipTelemetry()) {
    mixpanel.disable();
    return;
  }

  Sentry.init({
    dsn: "https://41c20dff316f42fea692ef4f0d055261@o437061.ingest.sentry.io/5399075",
    integrations: [new Integrations.BrowserTracing()],
    tracesSampleRate: 1.0,
    release: process.env.REPLAY_RELEASE ? process.env.REPLAY_RELEASE : "development",
    beforeSend(event) {
      if (event) {
        const exceptionValue = event?.exception?.values?.[0].value;
        if (ignoreList.some(ignore => exceptionValue?.includes(ignore))) {
          return null;
        }
      }

      return event;
    },
  });

  mixpanel.register({ recordingId: context.recordingId });

  Sentry.setContext("recording", { ...context, url: window.location.href });
}

function ApolloWrapper({
  children,
  recordingId,
}: {
  recordingId: string | undefined;
  children: ReactNode;
}) {
  const { loading, token, error } = useToken();

  if (loading) {
    return recordingId ? <BlankLoadingScreen /> : null;
  }

  if (error) {
    if (error.message === "Could not open popup") {
      return <PopupBlockedError />;
    } else {
      return null;
    }
  }

  return (
    <ApolloProvider client={createApolloClient(token, recordingId)}>{children}</ApolloProvider>
  );
}

export function bootstrapApp(props: AppProps, context: Record<string, any>, store: UIStore) {
  setupTelemetry(context);

  ReactDOM.render(
    <Router>
      <tokenManager.Auth0Provider>
        <Provider store={store}>
          <ApolloWrapper recordingId={context.recordingId}>
            <App {...props} />
          </ApolloWrapper>
        </Provider>
      </tokenManager.Auth0Provider>
    </Router>,
    document.querySelector("#app")
  );
}
