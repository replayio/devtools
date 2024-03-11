import sortBy from "lodash/sortBy";
import { useMemo } from "react";
import { ConnectedProps, connect } from "react-redux";

import { useGetComments } from "ui/hooks/comments/comments";
import { useGetRecordingId } from "ui/hooks/recordings";
import { UIState } from "ui/state";

import { selectors } from "../../reducers";
import CommentMarker from "./CommentMarker";

function Comments({ hoveredItem }: PropsFromRedux) {
  const recordingId = useGetRecordingId();
  const { comments, loading, error } = useGetComments(recordingId);
  const sortedComments = useMemo(() => sortBy(comments, comment => comment.time), [comments]);

  // Don't render anything if the comments are loading. For now, we fail silently
  // if there happens to be an error while fetching the comments. In the future, we
  // should do something to alert the user that the query has failed and provide next
  // steps for fixing that by refetching/refreshing.
  if (loading || error) {
    return null;
  }

  return (
    <>
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
    </>
  );
}

const connector = connect((state: UIState) => ({
  playback: selectors.getPlayback(state),
  hoveredItem: selectors.getHoveredItem(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(Comments);
