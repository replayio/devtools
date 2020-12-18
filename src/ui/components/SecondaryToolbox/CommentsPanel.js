import React, { useState, useEffect } from "react";

import { connect } from "react-redux";
import { selectors } from "ui/reducers";
import hooks from "ui/hooks";
import { sortBy } from "lodash";

import Comment from "ui/components/SecondaryToolbox/Comment";
import "./CommentsPanel.css";

function CommentsPanel({ recordingId }) {
  const { comments, loading, error } = hooks.useGetComments(recordingId);

  // Don't render anything if the comments are loading. For now, we fail silently
  // if there happens to be an error while fetching the comments. In the future, we
  // should do something to alert the user that the query has failed and provide next
  // steps for fixing that by refetching/refreshing.
  if (loading || error) {
    return null;
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
