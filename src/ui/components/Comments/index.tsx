import sortBy from "lodash/sortBy";
import React from "react";
import { connect, ConnectedProps } from "react-redux";
import hooks from "ui/hooks";
import { UIState } from "ui/state";
import { Comment, PendingComment } from "ui/state/comments";

import { selectors } from "../../reducers";

import CommentMarker from "./CommentMarker";

function Comments({ pendingComment, hoveredItem }: PropsFromRedux) {
  const recordingId = hooks.useGetRecordingId();
  const { comments: hasuraComments, loading, error } = hooks.useGetComments(recordingId);

  // Don't render anything if the comments are loading. For now, we fail silently
  // if there happens to be an error while fetching the comments. In the future, we
  // should do something to alert the user that the query has failed and provide next
  // steps for fixing that by refetching/refreshing.
  if (loading || error) {
    return null;
  }

  const comments: (Comment | PendingComment["comment"])[] = [...hasuraComments];

  // New comments that haven't been sent to Hasura will not have an associated ID.
  // They're not included in the comments data from the query, so we have to insert
  // them manually here. If a pending comment has an ID, it already exists in the
  // comments data and we don't have to insert it.
  if (pendingComment && !(pendingComment as any).id) {
    comments.push(pendingComment.comment);
  }

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
  hoveredItem: selectors.getHoveredItem(state),
  pendingComment: selectors.getPendingComment(state),
  playback: selectors.getPlayback(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(Comments);
