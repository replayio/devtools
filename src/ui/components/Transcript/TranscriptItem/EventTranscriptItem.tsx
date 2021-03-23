import React from "react";
import CommentThread from "ui/components/Comments/TranscriptComments/CommentThread";
import TranscriptItem from "./TranscriptItem";
import { Event } from "ui/state/comments";
import { User } from "ui/types";

// Transcript item component for displaying events (Mouse Clicks) from the recording.

export default function EventTranscriptItem({
  event,
  collaborators,
}: {
  event: Event;
  collaborators?: User[];
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
