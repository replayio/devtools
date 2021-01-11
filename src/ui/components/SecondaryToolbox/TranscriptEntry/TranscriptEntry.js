import React from "react";
import Comment from "ui/components/Comments/Comment";
import EventEntry from "./EventEntry";

export default function TranscriptEntry({ entry }) {
  if (entry.__typename === "comments") {
    return <Comment comment={entry} />;
  } else {
    return <EventEntry entry={entry} />;
  }
}
