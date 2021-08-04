import React, { useEffect } from "react";
import { connect, ConnectedProps, Provider } from "react-redux";
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
import { bootstrapApp } from "ui/setup";
import "image/image.css";

const url = new URL(window.location.href);
const recordingId = url.searchParams.get("id");

const Upload = React.lazy(() => import("views/upload"));
const Account = React.lazy(() => import("ui/components/Account"));
const DevTools = React.lazy(() => import("ui/components/DevTools"));

bootstrapApp();

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
);

export default AppRouting;
