import React, { useState, useEffect } from "react";
import classnames from "classnames";

import { connect } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import hooks from "ui/hooks";
import { sortBy } from "lodash";

import Comment from "ui/components/SecondaryToolbox/Comment";
import "./CommentsPanel.css";
import moment from "moment";

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function CommentsPanel({ recordingId, eventMessages, currentTime, seek }) {
  const { comments, loading, error } = hooks.useGetComments(recordingId);

  // Don't render anything if the comments are loading. For now, we fail silently
  // if there happens to be an error while fetching the comments. In the future, we
  // should do something to alert the user that the query has failed and provide next
  // steps for fixing that by refetching/refreshing.
  if (loading || error) {
    return null;
  }

  const seekToEvent = item => {
    const { executionPoint, executionPointTime, frame } = item.message;
    seek(executionPoint, executionPointTime, !!frame);
  };

  if (!comments.length && !eventMessages.length) {
    return (
      <div className="comments-panel">
        <p>There is nothing here yet. Try adding a comment in the timeline below.</p>
      </div>
    );
  }

  const items = [...comments, ...eventMessages];

  const sortedEntries = sortBy(items, item => item.time || item.message.executionPointTime).map(
    (item, i) => {
      if (item.type != "click") {
        return <Comment comment={item} key={item.id} />;
      } else {
        return (
          <div
            key={i}
            onClick={() => seekToEvent(item)}
            className={classnames("comment", {
              selected: currentTime === item.message.executionPointTime,
            })}
          >
            <div className="img event-click" />
            <div>
              <div className="item-label">
                <span style={{ marginRight: "8px", color: "var(--theme-comment)" }}>
                  {moment.utc(item.message.executionPointTime).format("mm:ss")}
                </span>
                {capitalize(item.type)}
              </div>
              <div className="item-content">{`Event "${item.type}" on ${item.className}`}</div>
            </div>
          </div>
        );
      }
    }
  );

  return <div className="comments-panel">{sortedEntries}</div>;
}

export default connect(
  state => ({
    focusedCommentId: selectors.getFocusedCommentId(state),
    currentTime: selectors.getCurrentTime(state),
    recordingId: selectors.getRecordingId(state),
  }),
  { seek: actions.seek, createComment: actions.createComment }
)(CommentsPanel);
