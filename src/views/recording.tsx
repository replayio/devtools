import React, { useEffect } from "react";
import { connect, ConnectedProps } from "react-redux";
import { isTest } from "ui/utils/environment";
import { validateUUID } from "ui/utils/helpers";
import { setExpectedError } from "ui/actions/session";
import {
  useIsRecordingInitialized,
  useGetRecordingOwnerUserId,
  useGetRecordingId,
} from "ui/hooks/recordings";
import BlankScreen from "ui/components/shared/BlankScreen";
import { registerRecording } from "ui/utils/telemetry";
import Upload from "views/upload";
import DevTools from "ui/components/DevTools";

function Recording({ setExpectedError }: PropsFromRedux) {
  const recordingId = useGetRecordingId();
  const {
    initialized: recordingInitialized,
    loading: initializedLoading,
    graphQLError,
  } = useIsRecordingInitialized(recordingId);
  const { userId: ownerId, loading: ownerIdLoading } = useGetRecordingOwnerUserId(recordingId);

  useEffect(() => {
    if (!validateUUID(recordingId)) {
      return setExpectedError({
        message: "Invalid ID",
        content: `"${recordingId}" is not a valid recording ID`,
      });
    }
    if (graphQLError) {
      return setExpectedError({ message: "Error", content: graphQLError });
    }
  }, [graphQLError]);

  useEffect(() => {
    registerRecording(recordingId);
  }, [recordingId]);

  if (initializedLoading || ownerIdLoading || !validateUUID(recordingId) || graphQLError) {
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

const connector = connect(null, { setExpectedError });
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(Recording);
