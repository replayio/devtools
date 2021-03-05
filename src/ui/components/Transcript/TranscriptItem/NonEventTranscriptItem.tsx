import React from "react";
import { connect, ConnectedProps } from "react-redux";

import TranscriptItem from "./TranscriptItem";
import CommentThread from "ui/components/Comments/TranscriptComments/CommentThread";
const { getFilenameFromURL } = require("devtools/client/debugger/src/utils/sources-tree/getURL");
const { getTextAtLocation } = require("devtools/client/debugger/src/reducers/sources");
const { getFormattedTime } = require("ui/utils/timeline");

import { UIState } from "ui/state";
import { Comment } from "ui/state/comments";

type NonEventTranscriptItemProps = PropsFromRedux & {
  comment: Comment;
};

// Transcript item component for displaying non-events from the recording.
//
// Non-events refer to points that aren't associated with an Event (e.g. Mouse Click)
// for which there is a comment or pending comment.

function NonEventTranscriptItem({ comment, text }: NonEventTranscriptItemProps) {
  let icon = "location-marker";
  let label = "Point In Time";
  let secondaryLabel = getFormattedTime(comment.time);

  if (comment.source_location) {
    const filename = getFilenameFromURL(comment.source_location.sourceUrl);
    icon = "document-text";
    label = `${filename}:${comment.source_location.line}`;
    secondaryLabel = text;
  }

  return (
    <TranscriptItem
      item={comment}
      icon={<div className={`img ${icon}`} />}
      label={label}
      secondaryLabel={secondaryLabel}
    >
      <CommentThread comment={comment} time={comment.time} />
    </TranscriptItem>
  );
}

const connector = connect(
  (state: UIState, props: any) => ({
    text: props.comment.source_location
      ? getTextAtLocation(
          state,
          props.comment.source_location.sourceId,
          props.comment.source_location
        )
      : "",
  }),
  {}
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(NonEventTranscriptItem);
