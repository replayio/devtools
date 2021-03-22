import React from "react";
import CommentThread from "ui/components/Comments/TranscriptComments/CommentThread";
import TranscriptItem from "./TranscriptItem";
import { Event } from "ui/state/comments";

// Transcript item component for displaying events (Mouse Clicks) from the recording.

export default function EventTranscriptItem({
  event,
  collaborators,
}: {
  event: Event;
  collaborators: any;
}) {
  return (
    <TranscriptItem
      item={event}
      icon={<div className="img event-click" />}
      label="Mouse Click"
      secondaryLabel=""
    >
      <CommentThread collaborators={collaborators} comment={event.comment} time={event.time} />
    </TranscriptItem>
  );
}
