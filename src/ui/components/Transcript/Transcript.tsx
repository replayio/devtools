import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "ui/reducers";
import { sortBy } from "lodash";
import hooks from "ui/hooks";
import { ThreadFront } from "protocol/thread";

import TranscriptFilter from "ui/components/Transcript/TranscriptFilter";
import { EventTranscriptItem, NonEventTranscriptItem, PauseTranscriptItem } from "./TranscriptItem";
import "./Transcript.css";

import { UIState } from "ui/state";
import { Event, Comment, PauseItem } from "ui/state/comments";

function createEntries(comments: Comment[], clickEvents: Event[], shouldShowLoneEvents: boolean) {
  let entries = clickEvents.map(event => ({ ...event }));

  let nonNestedComments = comments.reduce((acc: Comment[], comment: Comment) => {
    const matchingEntryIndex = entries.findIndex(entry => entry.point == comment.point);
    if (matchingEntryIndex >= 0) {
      entries[matchingEntryIndex].comment = comment;
      return acc;
    } else {
      return [...acc, comment];
    }
  }, []);

  // If lone events are supposed to be hidden, filter them out.
  if (!shouldShowLoneEvents) {
    entries = entries.filter(entry => entry.comment);
  }

  return [...entries, ...nonNestedComments];
}

function Transcript({
  clickEvents,
  currentTime,
  pendingComment,
  playback,
  recordingId,
  shouldShowLoneEvents,
}: PropsFromRedux) {
  const { comments } = hooks.useGetComments(recordingId!);

  const entries: (Comment | Event | PauseItem)[] = createEntries(
    comments,
    clickEvents,
    shouldShowLoneEvents
  );

  const shouldCreatePauseTranscriptItem =
    !entries.find(entry => entry.time == currentTime) && !playback;

  if (shouldCreatePauseTranscriptItem) {
    entries.push({
      itemType: "pause",
      time: currentTime,
      point: ThreadFront.currentPoint,
      has_frames: ThreadFront.currentPointHasFrames,
    });
  }

  return (
    <div className="right-sidebar">
      <div className="right-sidebar-toolbar">
        <div className="right-sidebar-toolbar-item">Transcript</div>
        <TranscriptFilter />
      </div>
      <div className="transcript-panel">
        <div className="transcript-list">
          {sortBy(entries, ["time", "kind", "created_at"]).map((entry, i) => {
            if ("itemType" in entry) {
              return <PauseTranscriptItem item={entry} pendingComment={pendingComment} key={i} />;
            } else if ("content" in entry) {
              return <NonEventTranscriptItem comment={entry} key={i} />;
            } else {
              return <EventTranscriptItem event={entry} key={i} />;
            }
          })}
        </div>
      </div>
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({
    playback: selectors.getPlayback(state),
    currentTime: selectors.getCurrentTime(state),
    recordingId: selectors.getRecordingId(state),
    clickEvents: selectors.getEventsForType(state, "mousedown"),
    pendingComment: selectors.getPendingComment(state),
    shouldShowLoneEvents: selectors.getShouldShowLoneEvents(state),
  }),
  {}
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(Transcript);
