import React from "react";
import { Provider } from "react-redux";
import { Route, Switch } from "react-router-dom";
import { IntercomProvider } from "react-use-intercom";

import tokenManager from "ui/utils/tokenManager";
import { ApolloWrapper } from "ui/utils/apolloClient";
import App from "ui/components/App";
import { bootstrapApp } from "ui/setup";

import "image/image.css";

const Recording = React.lazy(() => import("./recording"));
const Account = React.lazy(() => import("ui/components/Account"));

bootstrapApp();

const AppRouting = () => {
  return (
    <tokenManager.Auth0Provider>
      <ApolloWrapper>
        <IntercomProvider appId={"k7f741xx"}>
          <Provider store={window.store}>
            <React.Suspense fallback={<div>Loading</div>}>
              <App>
                <Switch>
                  <Route path="/:recordingId" component={Recording} />
                  <Route exact path="/" component={Account} />
                </Switch>
              </App>
            </React.Suspense>
          </Provider>
        </IntercomProvider>
      </ApolloWrapper>
    </tokenManager.Auth0Provider>
  );
};

export default AppRouting;
