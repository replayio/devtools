import React, { useRef, useState } from "react";
import "./ReplayLink.css";
import { RecordingId } from "@recordreplay/protocol";

export default function ReplayLink({ recordingId }: { recordingId: RecordingId }) {
  const [showCopied, setShowCopied] = useState(false);
  const timeoutKey = useRef<NodeJS.Timeout | null>(null);
  const url = `https://app.replay.io/?id=${recordingId}`;

  const onClick = () => {
    navigator.clipboard.writeText(url);

    if (timeoutKey.current) {
      clearTimeout(timeoutKey.current);
    }

    setShowCopied(true);
    timeoutKey.current = setTimeout(() => setShowCopied(false), 2000);
  };

  return (
    <div className="copy-link relative flex flex-col items-center">
      <input
        type="text"
        value={url}
        onKeyPress={e => e.preventDefault()}
        onChange={e => e.preventDefault()}
        onClick={onClick}
      />
      {showCopied ? (
        <div className="absolute bottom-full p-2 bg-black bg-opacity-900 text-white shadow-2xl rounded-lg mb-2">
          Copied
        </div>
      ) : null}
    </div>
  );
}
