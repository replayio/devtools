import React from "react";
import { connect, ConnectedProps } from "react-redux";

import TranscriptItem from "./TranscriptItem";
import CommentThread from "ui/components/Comments/TranscriptComments/CommentThread";
const { getFilenameFromURL } = require("devtools/client/debugger/src/utils/sources-tree/getURL");
const { getTextAtLocation } = require("devtools/client/debugger/src/reducers/sources");
const { getFormattedTime } = require("ui/utils/timeline");
const { findClosestFunction } = require("devtools/client/debugger/src/utils/ast");
const { getSymbols } = require("devtools/client/debugger/src/reducers/ast");

import { UIState } from "ui/state";
import { Comment } from "ui/state/comments";
import { User } from "ui/types";

type PropsFromParent = {
  comment: Comment;
};
type NonEventTranscriptItemProps = PropsFromRedux & PropsFromParent;

// Transcript item component for displaying non-events from the recording.
//
// Non-events refer to points that aren't associated with an Event (e.g. Mouse Click)
// for which there is a comment or pending comment.

function NonEventTranscriptItem({
  comment,
  closestFunction,
  snippet,
}: NonEventTranscriptItemProps) {
  let icon = "location-marker";
  let label = "Point In Time";
  let secondaryLabel = getFormattedTime(comment.time);

  if (comment.source_location) {
    const { sourceUrl, line } = comment.source_location;
    const filename = getFilenameFromURL(sourceUrl);

    icon = "document-text";
    label = closestFunction?.name || `${filename}:${line}`;
    secondaryLabel = snippet;
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
  (state: UIState, { comment: { source_location } }: PropsFromParent) => ({
    snippet: source_location
      ? getTextAtLocation(state, source_location.sourceId, source_location)
      : "",
    closestFunction: source_location
      ? findClosestFunction(getSymbols(state, { id: source_location?.sourceId }), source_location)
      : null,
  }),
  {}
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(NonEventTranscriptItem);
