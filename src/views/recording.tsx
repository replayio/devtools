import React, { useEffect } from "react";
import { connect, ConnectedProps } from "react-redux";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { isTest } from "ui/utils/environment";
import { validateUUID } from "ui/utils/helpers";
import { setExpectedError } from "ui/actions/session";
import { useIsRecordingInitialized, useGetRecordingOwnerUserId } from "ui/hooks/recordings";
import BlankScreen from "ui/components/shared/BlankScreen";
import { bootstrapApp } from "ui/setup";
import { registerRecording } from "ui/utils/telemetry";
import Upload from "views/upload";
import DevTools from "ui/components/DevTools";

import "ui/setup/dynamic/devtools";

bootstrapApp();

const connector = connect(null, { setExpectedError });
type PropsFromRedux = ConnectedProps<typeof connector>;

const Recording = withRouter(
  ({ match, setExpectedError }: PropsFromRedux & RouteComponentProps<{ recordingId: string }>) => {
    const { recordingId } = match.params;

    const {
      initialized: recordingInitialized,
      loading: initializedLoading,
      graphQLError,
    } = useIsRecordingInitialized(recordingId);
    const { userId: ownerId, loading: ownerIdLoading } = useGetRecordingOwnerUserId(recordingId);

    useEffect(() => {
      if (recordingId) {
        if (!validateUUID(recordingId)) {
          setExpectedError({
            message: "Invalid ID",
            content: `"${recordingId}" is not a valid recording ID`,
          });
        } else if (graphQLError) {
          setExpectedError({ message: "Error", content: graphQLError });
        }
      }
    }, [graphQLError]);

    useEffect(() => {
      registerRecording(recordingId);
    }, [recordingId]);

    if (!validateUUID(recordingId) || initializedLoading || ownerIdLoading || graphQLError) {
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
  }
);

export default Recording;
