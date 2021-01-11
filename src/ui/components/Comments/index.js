import React, { useEffect } from "react";
import { connect } from "react-redux";

import hooks from "ui/hooks";
import Comment from "./Comment";
import CommentMarker from "./CommentMarker";
import { selectors } from "../../reducers";
import { sortBy } from "lodash";

import "./Comments.css";

function Comments({ playback, recordingId }) {
  const { comments, loading, error } = hooks.useGetComments(recordingId);

  // Don't render anything if the comments are loading. For now, we fail silently
  // if there happens to be an error while fetching the comments. In the future, we
  // should do something to alert the user that the query has failed and provide next
  // steps for fixing that by refetching/refreshing.
  if (loading || error) {
    return null;
  }
  const sortedComments = sortBy(comments, comment => comment.time);

  return (
    <div className="comments-container">
      {sortedComments.map((comment, index) => (
        <CommentMarker key={comment.id} comment={comment} comments={sortedComments} index={index} />
      ))}
      {!playback ? <CommentMarker comments={sortedComments} /> : null}
    </div>
  );
}

export default connect(state => ({
  playback: selectors.getPlayback(state),
  recordingId: selectors.getRecordingId(state),
}))(Comments);
