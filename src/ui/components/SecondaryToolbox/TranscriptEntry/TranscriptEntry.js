import React from "react";
import CommentThread from "ui/components/Comments/CommentThread";
import EventEntry from "./EventEntry";

export default function TranscriptEntry({ entry }) {
  if ("content" in entry) {
    return <CommentThread comment={entry} />;
  } else {
    return <EventEntry event={entry} />;
  }
}
