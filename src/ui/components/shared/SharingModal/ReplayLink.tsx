import React from "react";
import "./ReplayLink.css";
import { RecordingId } from "@recordreplay/protocol";

export default function ReplayLink({ recordingId }: { recordingId: RecordingId }) {
  return (
    <div className="copy-link">
      <input
        type="text"
        value={`https://replay.io/view?id=${recordingId}`}
        onKeyPress={e => e.preventDefault()}
        onChange={e => e.preventDefault()}
      />
    </div>
  );
}
