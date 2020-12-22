import React from "react";

import { connect } from "react-redux";
import { selectors } from "ui/reducers";
import hooks from "ui/hooks";
import { sortBy } from "lodash";

import TranscriptEntry from "./TranscriptEntry/index";
import "./CommentsPanel.css";

function CommentsPanel({ recordingId, clickEvents, showClicks }) {
  const { comments, loading, error } = hooks.useGetComments(recordingId);

  // Don't render anything if the comments are loading. For now, we fail silently
  // if there happens to be an error while fetching the comments. In the future, we
  // should do something to alert the user that the query has failed and provide next
  // steps for fixing that by refetching/refreshing.
  if (loading || error) {
    return null;
  }

  if (!comments.length && !clickEvents.length) {
    return (
      <div className="comments-panel">
        <p>There is nothing here yet. Try adding a comment in the timeline below.</p>
      </div>
    );
  }

  let entries = comments;
  if (showClicks) {
    entries = [...comments, ...clickEvents];
  }

  return (
    <div className="comments-panel">
      {sortBy(entries, entry => entry.time).map((entry, i) => (
        <TranscriptEntry entry={entry} key={i} />
      ))}
    </div>
  );
}

export default connect(state => ({
  recordingId: selectors.getRecordingId(state),
  clickEvents: selectors.getEventsForType(state, "mousedown"),
}))(CommentsPanel);
