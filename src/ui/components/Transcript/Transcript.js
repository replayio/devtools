import React from "react";

import { connect } from "react-redux";
import { selectors } from "ui/reducers";
import hooks from "ui/hooks";
import { sortBy } from "lodash";

import AddCommentButton from "ui/components/Timeline/AddCommentButton";
import TranscriptItem from "ui/components/Transcript/TranscriptItem";
import CommentThread from "ui/components/Comments/CommentThread.js";
import "./Transcript.css";

function Transcript({ recordingId, clickEvents, pendingComment }) {
  const { comments } = hooks.useGetComments(recordingId);

  // We allow the panel to render its entries whether or not the
  // comments have loaded yet. This optimistically assumes that eventually the
  // comments will finish loading and we'll re-render then. This fails silently
  // if the query returns an error and we should add error handling that provides
  // next steps for fixing the error by refetching/refreshing.
  let entries = [...comments, ...clickEvents] || [];

  // New comments that haven't been sent to Hasura will not have an associated ID.
  // They're not included in the comments data from the query, so we have to insert
  // them manually here. If a pending comment has an ID, it already exists in the
  // comments data and we don't have to insert it.
  if (pendingComment && !pendingComment.id) {
    entries = [...entries, pendingComment];
  }

  return (
    <div className="comments-panel">
      <AddCommentButton />
      {sortBy(entries, ["time", "kind", "created_at"]).map((entry, i) => {
        if ("content" in entry) {
          return <CommentTranscriptItem comment={entry} key={i} />;
        } else {
          return <EventTranscriptItem event={entry} key={i} />;
        }
      })}
    </div>
  );
}

function EventTranscriptItem({ event }) {
  return (
    <TranscriptItem item={event} icon={<div className="img event-click" />} label="Mouse Click" />
  );
}

function CommentTranscriptItem({ comment }) {
  return (
    <TranscriptItem item={comment} icon={<div className="img chat-alt" />} label="Comment">
      <CommentThread comment={comment} />
    </TranscriptItem>
  );
}

export default connect(state => ({
  recordingId: selectors.getRecordingId(state),
  clickEvents: selectors.getEventsForType(state, "mousedown"),
  pendingComment: selectors.getPendingComment(state),
}))(Transcript);
