import React from "react";
import CommentThread from "ui/components/Comments/CommentThread";
import EventEntry from "./EventEntry";
import "./TranscriptEntry.css";

export default function TranscriptEntry({ entry }) {
  if ("content" in entry) {
    return (
      <div className="transcript-item">
        <div className="icon-container">
          <div className="img event-click" />
        </div>
        <CommentThread comment={entry} />;
      </div>
    );
  } else {
    return <EventEntry event={entry} />;
  }
}
