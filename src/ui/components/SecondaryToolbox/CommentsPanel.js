import React from "react";

import { connect } from "react-redux";
import { selectors } from "ui/reducers";
import hooks from "ui/hooks";
import { sortBy } from "lodash";

import TranscriptEntry from "./TranscriptEntry/index";
import AddCommentButton from "ui/components/Timeline/AddCommentButton";
import "./CommentsPanel.css";

function CommentsPanel({ recordingId, clickEvents, pendingComment }) {
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
      {sortBy(entries, ["time", "kind", "created_at"]).map((entry, i) => (
        <TranscriptEntry entry={entry} key={i} />
      ))}
    </div>
  );
}

export default connect(state => ({
  recordingId: selectors.getRecordingId(state),
  clickEvents: selectors.getEventsForType(state, "mousedown"),
  pendingComment: selectors.getPendingComment(state),
}))(CommentsPanel);
