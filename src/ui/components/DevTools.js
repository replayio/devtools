import React from "react";
import { connect } from "react-redux";

import Toolbox from "./Toolbox";
import Comments from "./Comments";
import Recordings from "./Recordings/index";
import Header from "./Header/index";
import Viewer from "./Viewer";
import Loader from "./shared/Loader";
import SplitBox from "devtools/client/shared/components/splitter/SplitBox";
import RecordingLoadingScreen from "./RecordingLoadingScreen";
import { UnauthorizedAccessError } from "./shared/Error";

import { actions } from "../actions";
import { selectors } from "../reducers";
import { screenshotCache, nextPaintEvent, getClosestPaintPoint } from "protocol/graphics";
import { gql, useQuery } from "@apollo/client";
import { useAuth0 } from "@auth0/auth0-react";
import { data } from "react-dom-factories";
import { setExpectedError } from "../actions/app";

const GET_RECORDING = gql`
  query GetRecording($recordingId: String) {
    recordings(where: { recording_id: { _eq: $recordingId } }) {
      id
      title
      recordingTitle
      is_private
      user {
        auth_id
      }
    }
  }
`;

function DevtoolsSplitBox({ updateTimelineDimensions, tooltip }) {
  const toolbox = <Toolbox />;
  const viewer = <Viewer tooltip={tooltip} />;

  return (
    <SplitBox
      style={{ width: "100vw", overflow: "hidden" }}
      splitterSize={1}
      initialSize="50%"
      minSize="20%"
      maxSize="80%"
      vert={false}
      onMove={num => updateTimelineDimensions()}
      startPanel={viewer}
      endPanel={toolbox}
      endPanelControl={false}
    />
  );
}

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

function getIsAuthorized({ data, error, isAuthenticated }) {
  // We let Hasura decide whether or not the user can view a recording. The response to our query
  // will have a recording if they're authorized to view the recording, and will be empty if not.
  return data.recordings.length;
}

function DevTools({
  unfocusComment,
  loading,
  uploading,
  tooltip,
  hasFocusedComment,
  updateTimelineDimensions,
  recordingDuration,
  recordingId,
  expectedError,
  setExpectedError,
}) {
  const { user, isAuthenticated } = useAuth0();
  const { data, error, loading: queryIsLoading } = useQuery(GET_RECORDING, {
    variables: { recordingId },
  });

  if (expectedError) {
    return null;
  }

  if (queryIsLoading) {
    return <Loader />;
  } else if (recordingDuration === null || uploading) {
    const message = getUploadingMessage(uploading);
    return <Loader message={message} />;
  }

  const isAuthorized = getIsAuthorized({ data, error, isAuthenticated });

  if (!isAuthorized) {
    if (isAuthenticated) {
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

  return (
    <>
      <Header />
      <DevtoolsSplitBox tooltip={tooltip} updateTimelineDimensions={updateTimelineDimensions} />
      {hasFocusedComment && <div className="app-mask" onClick={unfocusComment} />}
      <Comments />
    </>
  );
}

export default connect(
  state => ({
    loading: selectors.getLoading(state),
    uploading: selectors.getUploading(state),
    tooltip: selectors.getTooltip(state),
    hasFocusedComment: selectors.hasFocusedComment(state),
    recordingDuration: selectors.getRecordingDuration(state),
    sessionId: selectors.getSessionId(state),
    recordingId: selectors.getRecordingId(state),
    expectedError: selectors.getExpectedError(state),
  }),
  {
    updateTimelineDimensions: actions.updateTimelineDimensions,
    unfocusComment: actions.unfocusComment,
    setExpectedError: actions.setExpectedError,
  }
)(DevTools);
