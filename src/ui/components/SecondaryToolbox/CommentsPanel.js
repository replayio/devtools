import React, { useState } from "react";

import { connect } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { sortBy } from "lodash";
import { gql, useQuery } from "@apollo/client";

import Comment from "ui/components/SecondaryToolbox/Comment";

import "./CommentsPanel.css";

const GET_COMMENTS = gql`
  query GetComments($recordingId: uuid) {
    comments(where: { recording_id: { _eq: $recordingId } }) {
      id
      content
      created_at
      recording_id
      user_id
      updated_at
      time
    }
  }
`;

function CommentsPanel({ recordingId }) {
  const [editingComment, setEditingComment] = useState(false);
  const { data } = useQuery(GET_COMMENTS, {
    variables: { recordingId },
  });

  const { comments } = data;
  const toggleEditingCommentOn = () => setEditingComment(true);
  const toggleEditingCommentOff = () => setEditingComment(false);

  if (!comments.length) {
    return (
      <div className="comments-panel">
        <p>There is nothing here yet. Try adding a comment in the timeline below.</p>
      </div>
    );
  }

  return (
    <div className="comments-panel">
      {sortBy(comments, comment => comment.time).map(comment => (
        <Comment
          comment={comment}
          key={comment.id}
          toggleEditingCommentOff={toggleEditingCommentOff}
          toggleEditingCommentOn={toggleEditingCommentOn}
        />
      ))}
    </div>
  );
}

export default connect(state => ({
  recordingId: selectors.getRecordingId(state),
  // comments: selectors.getComments(state),
  // focusedCommentId: selectors.getFocusedCommentId(state),
}))(CommentsPanel);
