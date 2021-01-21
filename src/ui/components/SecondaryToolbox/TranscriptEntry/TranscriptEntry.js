import React from "react";
import Comment from "ui/components/Comments/Comment";
import EventEntry from "./EventEntry";

export default function TranscriptEntry({ entry }) {
  if ("content" in entry) {
    return <Comment comment={entry} />;
  } else {
    return <EventEntry event={entry} />;
  }
}
