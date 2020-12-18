import React, { useState, useEffect } from "react";

import { connect } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { sortBy } from "lodash";
import { gql, useQuery, useLazyQuery } from "@apollo/client";

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
  const { data, loading } = useQuery(GET_COMMENTS, {
    variables: { recordingId },
  });

  if (!data || loading) {
    return null;
  }

  const { comments } = data;

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
        <Comment comment={comment} key={comment.id} />
      ))}
    </div>
  );
}

export default connect(state => ({
  recordingId: selectors.getRecordingId(state),
}))(CommentsPanel);
