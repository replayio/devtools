import React, { useState, useEffect } from "react";

import { connect } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { sortBy } from "lodash";
// import { gql, useQuery, useLazyQuery } from "@apollo/client";
import hooks from "ui/hooks";

import Comment from "ui/components/SecondaryToolbox/Comment";
import "./CommentsPanel.css";

function CommentsPanel({ recordingId }) {
  const { comments, loading, error } = hooks.useGetComments(recordingId);

  if (loading) {
    console.log("nope, still loading");
    return (
      <div className="comments-panel">
        <p>Comments are loading</p>
      </div>
    );
  }

  if (error) {
    console.log("nope, still loading");
    return (
      <div className="comments-panel">
        <p>WOMP WOMP</p>
      </div>
    );
  }

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
