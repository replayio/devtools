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
import { createRouteFromLegacyParams } from "ui/utils/routes";
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
                  <Route path="/team/:workspaceId" component={Account} />
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
    history.replace(createRouteFromLegacyParams(currentParams));
  });
  return null;
}

export default AppRouting;
