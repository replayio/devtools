import React, { useRef, useState } from "react";
import "./ReplayLink.css";
import { RecordingId } from "@recordreplay/protocol";

export function UrlCopy({ url }: { url: string }) {
  const [showCopied, setShowCopied] = useState(false);
  const timeoutKey = useRef<NodeJS.Timeout | null>(null);

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
        className="text-sm"
        type="text"
        value={url}
        onKeyPress={e => e.preventDefault()}
        onChange={e => e.preventDefault()}
        onClick={onClick}
      />
      {showCopied ? (
        <div className="absolute bottom-full p-1.5 bg-black bg-opacity-900 text-white shadow-2xl rounded-lg mb-1.5">
          Copied to Clipboard
        </div>
      ) : null}
    </div>
  );
}

export default function ReplayLink({ recordingId }: { recordingId: RecordingId }) {
  return <UrlCopy url={`https://app.replay.io/recording/${recordingId}`} />;
}
