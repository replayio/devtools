import React, { useEffect } from "react";
import { Route, Switch, useHistory } from "react-router-dom";
import { Provider } from "react-redux";
import { IntercomProvider } from "react-use-intercom";
import tokenManager from "ui/utils/tokenManager";
import { ApolloWrapper } from "ui/utils/apolloClient";
import { LoadingScreen } from "ui/components/shared/BlankScreen";
import ErrorBoundary from "ui/components/ErrorBoundary";
import App from "ui/components/App";
import { bootstrapApp } from "ui/setup";
import "image/image.css";

const Recording = React.lazy(() => import("./recording"));
const Account = React.lazy(() => import("ui/components/Account"));

const store = bootstrapApp();

const AppRouting = () => (
  <Provider store={store}>
    <tokenManager.Auth0Provider>
      <ApolloWrapper>
        <IntercomProvider appId={"k7f741xx"}>
          <App>
            <ErrorBoundary>
              <React.Suspense fallback={<LoadingScreen />}>
                <Switch>
                  <Route path="/recording/:recordingId" component={Recording} />
                  <Route exact path="/" component={Account} />
                  <Route exact path="/view" component={ViewRedirect} />
                </Switch>
              </React.Suspense>
            </ErrorBoundary>
          </App>
        </IntercomProvider>
      </ApolloWrapper>
    </tokenManager.Auth0Provider>
  </Provider>
);

// This component replaces a legacy /view route with its current equivalent
function ViewRedirect() {
  const history = useHistory();
  const currentParams = new URLSearchParams(window.location.search);
  useEffect(() => {
    history.replace(createReplayURL(currentParams));
  });
  return null;
}

/**
 * Create a (host relative) URL with the given parameters. Used for replacing
 * legacy routes with their current equivalents.
 */
export function createReplayURL(currentParams: URLSearchParams) {
  const recordingId = currentParams.get("id");
  const path = recordingId ? `/recording/${recordingId}` : "/";
  const newParams = new URLSearchParams();
  currentParams.forEach((value, key) => {
    if (key !== "id") {
      newParams.set(key, value);
    }
  });
  return `${path}?${newParams.toString()}`;
}

export default AppRouting;
