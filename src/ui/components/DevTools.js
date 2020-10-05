import React from "react";
import { connect } from "react-redux";

import Toolbox from "./Toolbox";
import Comments from "./Comments";
import Recordings from "./Recordings/index";
import Header from "./Header";
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

const GET_RECORDING_ANONYMOUS = gql`
  query MyQuery($recordingId: String) {
    recordings(where: { recording_id: { _eq: $recordingId } }) {
      id
      is_private
    }
  }
`;

const GET_RECORDING = gql`
  query MyQuery($recordingId: String) {
    recordings(where: { recording_id: { _eq: $recordingId } }) {
      id
      is_private
      user_id
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

function getIsAuthorized(recordingId, auth0User, isAuthenticated) {
  const query = isAuthenticated ? GET_RECORDING : GET_RECORDING_ANONYMOUS;

  const { data } = useQuery(query, {
    variables: { recordingId },
  });

  // Comment this block out if you want to simulate a private recording
  if (!data.recordings[0].is_private) {
    return true;
  }

  if (!isAuthenticated) {
    return false;
  }

  return data.recordings[0].user.auth_id === auth0User.sub ? true : false;
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
}) {
  const { user, isAuthenticated } = useAuth0();
  const isAuthorized = getIsAuthorized(recordingId, user, isAuthenticated);

  if (!isAuthorized) {
    return <UnauthorizedAccessError />;
  }

  if (recordingDuration === null || uploading) {
    const message = getUploadingMessage(uploading);
    return <Loader message={message} />;
  } else if (loading < 100) {
    return <RecordingLoadingScreen />;
  }

  return (
    <>
      <Header />
      <Comments />
      {hasFocusedComment && <div className="app-mask" onClick={unfocusComment} />}
      <DevtoolsSplitBox tooltip={tooltip} updateTimelineDimensions={updateTimelineDimensions} />
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
  }),
  {
    updateTimelineDimensions: actions.updateTimelineDimensions,
    unfocusComment: actions.unfocusComment,
  }
)(DevTools);
