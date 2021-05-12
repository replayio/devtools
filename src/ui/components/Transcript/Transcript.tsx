import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "ui/reducers";
import sortBy from "lodash/sortBy";
import hooks from "ui/hooks";
import { isTest } from "ui/utils/environment";

import "./Transcript.css";
import UploadScreen from "../UploadScreen";

import { UIState } from "ui/state";
import { Comment, PendingNewComment } from "ui/state/comments";
import CommentCard from "ui/components/Comments/TranscriptComments/CommentCard";

function Transcript({ recordingId, pendingComment }: PropsFromRedux) {
  const { comments } = hooks.useGetComments(recordingId!);
  const { recording, loading } = hooks.useGetRecording(recordingId!);
  const { userId } = hooks.useGetUserId();
  const isAuthor = userId && userId == recording?.userId;

  if (loading) {
    return null;
  }

  // Only show the initialization screen if the replay is not being opened
  // for testing purposes.
  if (isAuthor && !recording?.isInitialized && !isTest()) {
    return <UploadScreen />;
  }

  const displayedComments: (Comment | PendingNewComment)[] = [...comments];

  if (pendingComment?.type == "new_comment") {
    displayedComments.push(pendingComment.comment);
  }

  return (
    <div className="right-sidebar">
      <div className="right-sidebar-toolbar">
        <div className="right-sidebar-toolbar-item">Comments</div>
      </div>
      <div className="transcript-panel">
        {displayedComments.length > 0 ? (
          <div className="transcript-list space-y-4">
            {sortBy(displayedComments, ["time"]).map(comment => {
              return <CommentCard comment={comment} key={"id" in comment ? comment.id : 0} />;
            })}
          </div>
        ) : (
          <div className="transcript-list space-y-4 text-lg text-gray-500">
            None yet! Please click on the video to place the first comment.
          </div>
        )}
      </div>
    </div>
  );
}

/*
<div>
  {showButton ? <button>Hello</button> : null}
  </div>
*/

const connector = connect((state: UIState) => ({
  recordingId: selectors.getRecordingId(state),
  pendingComment: selectors.getPendingComment(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(Transcript);
