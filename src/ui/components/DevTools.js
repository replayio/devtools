import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import { gql, useQuery, useMutation } from "@apollo/client";
import { useAuth0 } from "@auth0/auth0-react";

import Header from "./Header/index";
import Loader from "./shared/Loader";
import RecordingLoadingScreen from "./RecordingLoadingScreen";
import NonDevView from "./Views/NonDevView";
import DevView from "./Views/DevView";

import { actions } from "../actions";
import { selectors } from "../reducers";
import { setUserInBrowserPrefs } from "../utils/browser";

const GET_RECORDING = gql`
  query GetRecording($recordingId: String) {
    recordings(where: { recording_id: { _eq: $recordingId } }) {
      id
      title
      recordingTitle
      is_private
      date
    }
  }
`;

const CREATE_SESSION = gql`
  mutation CreateSession($object: sessions_insert_input!) {
    insert_sessions_one(object: $object) {
      id
      controller_id
      recording_id
    }
  }
`;

function getUploadingMessage(uploading) {
  if (!uploading) {
    return "";
  }

  const { total, amount } = uploading;
  if (total) {
    return `Waiting for upload… ${amount} / ${total} MB`;
  }

  return `Waiting for upload… ${amount} MB`;
}

function getIsAuthorized({ data }) {
  const test = new URL(window.location.href).searchParams.get("test");

  // Ideally, test recordings should be inserted into Hasura. However, test recordings are currently
  // not being inserted as a Hasura recordings row, so the GET_RECORDING query will respond with an
  // empty recordings array. To temporarily work around this for now, we return `true` here so
  // the test can proceed.
  if (test) {
    return true;
  }

  // We let Hasura decide whether or not the user can view a recording. The response to our query
  // will have a recording if they're authorized to view the recording, and will be empty if not.
  return data.recordings.length;
}

function DevTools({
  loading,
  uploading,
  recordingDuration,
  recordingId,
  expectedError,
  setExpectedError,
  selectedPanel,
  viewMode,
  updateUser,
  sessionId,
}) {
  const [recordingLoaded, setRecordingLoaded] = useState(false);
  const auth = useAuth0();
  const { data, loading: queryIsLoading } = useQuery(GET_RECORDING, {
    variables: { recordingId },
  });
  const [CreateSession] = useMutation(CREATE_SESSION);

  useEffect(() => {
    setUserInBrowserPrefs(auth.user);
    updateUser(auth.user);
  }, [auth.user]);

  useEffect(() => {
    if (auth.user && sessionId) {
      const object = {
        id: sessionId,
        recording_id: recordingId,
        controller_id: sessionId.split("/")[0],
      };
      CreateSession({ variables: { object } });
    }
  }, [auth.user, sessionId]);

  useEffect(() => {
    if (recordingLoaded) {
      gToolbox.init(selectedPanel);
    }
  }, [recordingLoaded]);

  if (expectedError) {
    return null;
  }

  if (queryIsLoading) {
    return <Loader />;
  } else if (recordingDuration === null || uploading) {
    const message = getUploadingMessage(uploading);
    return <Loader message={message} />;
  }

  const isAuthorized = getIsAuthorized({ data });

  if (!isAuthorized) {
    if (auth.isAuthenticated) {
      setExpectedError({ message: "You don't have permission to view this recording." });
    } else {
      setExpectedError({
        message: "You need to sign in to view this recording.",
        action: "sign-in",
      });
    }
    return null;
  }

  if (loading < 100) {
    return <RecordingLoadingScreen />;
  }

  if (!recordingLoaded) {
    setRecordingLoaded(true);
  }

  return (
    <>
      <Header />
      {viewMode == "dev" ? <DevView /> : <NonDevView />}
    </>
  );
}

export default connect(
  state => ({
    loading: selectors.getLoading(state),
    uploading: selectors.getUploading(state),
    hasFocusedComment: selectors.hasFocusedComment(state),
    recordingDuration: selectors.getRecordingDuration(state),
    sessionId: selectors.getSessionId(state),
    recordingId: selectors.getRecordingId(state),
    expectedError: selectors.getExpectedError(state),
    selectedPanel: selectors.getSelectedPanel(state),
    viewMode: selectors.getViewMode(state),
    narrowMode: selectors.getNarrowMode(state),
  }),
  {
    updateTimelineDimensions: actions.updateTimelineDimensions,
    unfocusComment: actions.unfocusComment,
    setExpectedError: actions.setExpectedError,
    updateUser: actions.updateUser,
  }
)(DevTools);
