import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "ui/reducers";
import { sortBy } from "lodash";
import hooks from "ui/hooks";

import AddCommentButton from "ui/components/Transcript/AddCommentButton";
import TranscriptItem from "ui/components/Transcript/TranscriptItem";
const CommentThread = require("ui/components/Comments/CommentThread").default;
import "./Transcript.css";

import { UIState } from "ui/state";
import { PendingComment, Comment } from "ui/state/comments";
import { MouseEvent } from "@recordreplay/protocol";

function Transcript({ recordingId, clickEvents, pendingComment }: PropsFromRedux) {
  const { comments } = hooks.useGetComments(recordingId!);

  // We allow the panel to render its entries whether or not the
  // comments have loaded yet. This optimistically assumes that eventually the
  // comments will finish loading and we'll re-render then. This fails silently
  // if the query returns an error and we should add error handling that provides
  // next steps for fixing the error by refetching/refreshing.
  let entries: (Comment | MouseEvent | PendingComment)[] = [...comments, ...clickEvents] || [];

  // New comments that haven't been sent to Hasura will not have an associated ID.
  // They're not included in the comments data from the query, so we have to insert
  // them manually here. If a pending comment has an ID, it already exists in the
  // comments data and we don't have to insert it.
  if (pendingComment && !pendingComment.id) {
    entries = [...entries, pendingComment];
  }

  return (
    <div className="transcript-panel">
      <AddCommentButton />
      <div className="transcript-list">
        {sortBy(entries, ["time", "kind", "created_at"]).map((entry, i) => {
          if ("content" in entry) {
            return <CommentTranscriptItem comment={entry} key={i} />;
          } else {
            return <EventTranscriptItem event={entry} key={i} />;
          }
        })}
      </div>
    </div>
  );
}

function EventTranscriptItem({ event }: { event: MouseEvent }) {
  return (
    <TranscriptItem item={event} icon={<div className="img event-click" />} label="Mouse Click" />
  );
}

function CommentTranscriptItem({ comment }: { comment: Comment | PendingComment }) {
  return (
    <TranscriptItem item={comment} icon={<div className="img chat-alt" />} label="Comment">
      <CommentThread comment={comment} />
    </TranscriptItem>
  );
}

const connector = connect((state: UIState) => ({
  recordingId: selectors.getRecordingId(state),
  clickEvents: selectors.getEventsForType(state, "mousedown"),
  pendingComment: selectors.getPendingComment(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(Transcript);
