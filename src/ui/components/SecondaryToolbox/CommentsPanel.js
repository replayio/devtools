import React from "react";

import { connect } from "react-redux";
import { selectors } from "ui/reducers";
import hooks from "ui/hooks";
import { sortBy } from "lodash";

import TranscriptEntry from "./TranscriptEntry/index";
import "./CommentsPanel.css";

function CommentsPanel({ recordingId, clickEvents, showClicks }) {
  const { comments } = hooks.useGetComments(recordingId);

  // We allow the panel to render its entries whether or not the
  // comments have loaded yet. This optimistically assumes that eventually the
  // comments will finish loading and we'll re-render then. This fails silently
  // if the query returns an erro and we should add error handling that provides
  // next steps for fixing the error by refetching/refreshing.
  let entries = comments || [];

  if (showClicks) {
    entries = [...entries, ...clickEvents];
  }

  if (!entries.length) {
    return (
      <div className="comments-panel">
        <p>There is nothing here yet. Try adding a comment in the timeline below.</p>
      </div>
    );
  }

  return (
    <div className="comments-panel">
      {sortBy(entries, ["time", "created_at"]).map((entry, i) => (
        <TranscriptEntry entry={entry} key={i} />
      ))}
    </div>
  );
}

export default connect(state => ({
  recordingId: selectors.getRecordingId(state),
  clickEvents: selectors.getEventsForType(state, "mousedown"),
}))(CommentsPanel);
