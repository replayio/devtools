import React from "react";
import { Provider } from "react-redux";
import { IntercomProvider } from "react-use-intercom";
import tokenManager from "ui/utils/tokenManager";
import { ApolloWrapper } from "ui/utils/apolloClient";
import BlankScreen from "ui/components/shared/BlankScreen";
import ErrorBoundary from "ui/components/ErrorBoundary";
import App from "ui/components/App";
import { bootstrapApp } from "ui/setup";
import "image/image.css";
import { Route, Switch } from "react-router-dom";

const Recording = React.lazy(() => import("./recording"));
const Account = React.lazy(() => import("ui/components/Account"));

bootstrapApp();

const AppRouting = () => (
  <tokenManager.Auth0Provider>
    <ApolloWrapper>
      <IntercomProvider appId={"k7f741xx"}>
        <Provider store={window.store}>
          <App>
            <ErrorBoundary>
              <React.Suspense fallback={<BlankScreen background="white" />}>
                <Switch>
                  <Route path="/recording/:recordingId" component={Recording} />
                  <Route exact path="/" component={Account} />
                </Switch>
              </React.Suspense>
            </ErrorBoundary>
          </App>
        </Provider>
      </IntercomProvider>
    </ApolloWrapper>
  </tokenManager.Auth0Provider>
);

export default AppRouting;
