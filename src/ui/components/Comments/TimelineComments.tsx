import React from "react";
import { connect, ConnectedProps } from "react-redux";

import hooks from "ui/hooks";
import CommentMarker from "./CommentMarker";
import { selectors } from "../../reducers";
import sortBy from "lodash/sortBy";

import { UIState } from "ui/state";

function TimelineComments({ pendingComment, hoveredItem }: PropsFromRedux) {
  const recordingId = hooks.useGetRecordingId();
  const { comments, loading, error } = hooks.useGetComments(recordingId);

  // Don't render anything if the comments are loading. For now, we fail silently
  // if there happens to be an error while fetching the comments. In the future, we
  // should do something to alert the user that the query has failed and provide next
  // steps for fixing that by refetching/refreshing.
  if (loading || error) {
    return null;
  }

  // New comments that haven't been sent to Hasura will not have an associated ID.
  // They're not included in the comments data from the query, so we have to insert
  // them manually here. If a pending comment has an ID, it already exists in the
  // comments data and we don't have to insert it.
  // if (pendingComment && !(pendingComment as any).id) {
  //   comments.push(pendingComment.comment);
  // } // TODO

  const sortedComments = sortBy(comments, comment => comment.time);

  return (
    <div className="comments-container">
      {sortedComments.map((comment, index) => {
        const isPrimaryHighlighted = hoveredItem?.point === comment.point;
        return (
          <CommentMarker
            key={index}
            comment={comment}
            comments={sortedComments}
            isPrimaryHighlighted={isPrimaryHighlighted}
          />
        );
      })}
    </div>
  );
}

const connector = connect((state: UIState) => ({
  playback: selectors.getPlayback(state),
  pendingComment: selectors.getPendingComment(state),
  hoveredItem: selectors.getHoveredItem(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(TimelineComments);
