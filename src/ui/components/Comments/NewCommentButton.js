import React from "react";
import { connect } from "react-redux";

import { getMarkerLeftOffset } from "ui/utils/timeline";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { gql, useMutation } from "@apollo/client";
import { getDirectiveNames } from "@apollo/client/utilities";
const markerWidth = 19;

const ADD_COMMENT = gql`
  mutation MyMutation($object: comments_insert_input! = {}) {
    insert_comments_one(object: $object) {
      id
    }
  }
`;

function getId(data) {
  const keysArray = Object.keys(data);
  const actualData = keysArray.reduce((acc, key) => [...acc, data[key]], []);

  return actualData[0].id;
}

function NewCommentButton({
  timelineDimensions,
  currentTime,
  zoomRegion,
  recordingId,
  focusedCommentId,
  setFocusedCommentId,
  comments,
}) {
  const [addComment] = useMutation(ADD_COMMENT, {
    onCompleted: data => {
      const id = getId(data);
      setFocusedCommentId(id);
    },
    refetchQueries: ["GetComments"],
  });

  // Skip rendering the button if any of the following applies:
  // - There is already a comment at that time.
  // - That time is not currently visible in the timeline
  // - There is a timeline comment that is currently focused.
  const isOnExistingComment = comments.some(comment => comment.time == currentTime);
  if (isOnExistingComment || focusedCommentId || zoomRegion.endTime <= currentTime) {
    return null;
  }

  const handleClick = () => {
    const newComment = {
      content: "",
      recording_id: recordingId,
      time: currentTime,
    };
    addComment({
      variables: { object: newComment },
    });
  };

  const leftOffset = getMarkerLeftOffset({
    time: currentTime,
    overlayWidth: timelineDimensions.width,
    zoom: zoomRegion,
    markerWidth: markerWidth,
  });

  return (
    <button
      className="create-comment"
      style={{
        left: `${leftOffset}%`,
      }}
      onClick={handleClick}
    />
  );
}

export default connect(
  state => ({
    timelineDimensions: selectors.getTimelineDimensions(state),
    zoomRegion: selectors.getZoomRegion(state),
    currentTime: selectors.getCurrentTime(state),
    recordingId: selectors.getRecordingId(state),
    focusedCommentId: selectors.getFocusedCommentId(state),
    // comments: selectors.getComments(state),
  }),
  {
    setFocusedCommentId: actions.setFocusedCommentId,
  }
)(NewCommentButton);
