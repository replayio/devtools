import React, { useEffect } from "react";
import { connect, ConnectedProps, Provider } from "react-redux";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { IntercomProvider } from "react-use-intercom";
import { isTest } from "ui/utils/environment";
import { validateUUID } from "ui/utils/helpers";
import { bootIntercom } from "ui/utils/intercom";
import tokenManager from "ui/utils/tokenManager";
import useAuth0 from "ui/utils/useAuth0";
import { ApolloWrapper } from "ui/utils/apolloClient";
import { setWorkspaceId } from "ui/actions/app";
import { setExpectedError } from "ui/actions/session";
import { useGetUserSettings } from "ui/hooks/settings";
import { useIsRecordingInitialized, useGetRecordingOwnerUserId } from "ui/hooks/recordings";
import BlankScreen from "ui/components/shared/BlankScreen";
import App from "ui/components/App";

const url = new URL(window.location.href);
const recordingId = url.searchParams.get("id");

const BrowserError = React.lazy(() => import("views/browser/error"));
const BrowserImport = React.lazy(() => import("views/browser/import-settings"));
const BrowserLaunch = React.lazy(() => import("views/browser/launch"));
const BrowserNewTab = React.lazy(() => import("views/browser/new-tab"));
const BrowserWelcome = React.lazy(() => import("views/browser/welcome"));
const Upload = React.lazy(() => import("views/upload"));
const Account = React.lazy(() => import("ui/components/Account"));
const DevTools = React.lazy(() => import("ui/components/DevTools"));

function PageSwitch({ setExpectedError, setWorkspaceId }: PropsFromRedux) {
  const { isAuthenticated, user } = useAuth0();
  const { userSettings, loading: settingsLoading } = useGetUserSettings();
  const {
    initialized: recordingInitialized,
    loading: initializedLoading,
    graphQLError,
  } = useIsRecordingInitialized(recordingId);
  const { userId: ownerId, loading: ownerIdLoading } = useGetRecordingOwnerUserId(recordingId);

  useEffect(() => {
    if (userSettings) {
      setWorkspaceId(userSettings.defaultWorkspaceId);
    }
  }, [userSettings]);

  useEffect(() => {
    if (isAuthenticated) {
      bootIntercom({ email: user.email });
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (recordingId) {
      if (!validateUUID(recordingId)) {
        return setExpectedError({
          message: "Invalid ID",
          content: `"${recordingId}" is not a valid recording ID`,
        });
      }
      if (graphQLError) {
        return setExpectedError({ message: "Error", content: graphQLError });
      }
    }
  }, [graphQLError]);

  if (initializedLoading || ownerIdLoading || settingsLoading) {
    return null;
  }

  if (recordingId) {
    if (!validateUUID(recordingId) || graphQLError) {
      return <BlankScreen />;
    }

    // Add a check to make sure the recording has an associated user ID.
    // We skip the upload step if there's no associated user ID, which
    // is the case for CI test recordings.
    if (recordingInitialized === false && !isTest() && ownerId) {
      return <Upload />;
    } else {
      return <DevTools />;
    }
  } else {
    return <Account />;
  }
}

const connector = connect(null, { setExpectedError, setWorkspaceId });
type PropsFromRedux = ConnectedProps<typeof connector>;
const ConnectedPageSwitch = connector(PageSwitch);

const AppRouting = () => (
  <React.Suspense fallback={<div>Loading</div>}>
    <Router>
      <Switch>
        <Route exact path="/browser/error" component={BrowserError} />
        <Route exact path="/browser/import-settings" component={BrowserImport} />
        <Route exact path="/browser/launch" component={BrowserLaunch} />
        <Route exact path="/browser/new-tab" component={BrowserNewTab} />
        <Route exact path="/browser/welcome" component={BrowserWelcome} />
        <Route>
          <tokenManager.Auth0Provider>
            <ApolloWrapper>
              <IntercomProvider appId={"k7f741xx"}>
                <Provider store={window.store}>
                  <App>
                    <React.Suspense fallback={<div>Loading</div>}>
                      <ConnectedPageSwitch />
                    </React.Suspense>
                  </App>
                </Provider>
              </IntercomProvider>
            </ApolloWrapper>
          </tokenManager.Auth0Provider>
        </Route>
      </Switch>
    </Router>
  </React.Suspense>
);

export default AppRouting;
