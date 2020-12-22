import React from "react";
import CommentEntry from "./CommentEntry";
import EventEntry from "./EventEntry";

export default function TranscriptEntry({ entry }) {
  if (entry.__typename === "comments") {
    return <CommentEntry comment={entry} />;
  } else {
    return <EventEntry entry={entry} />;
  }
}
