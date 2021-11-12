import React, { useRef, useState } from "react";
import { RecordingId } from "@recordreplay/protocol";
import { trackEvent } from "ui/utils/telemetry";

export function CopyButton({ recordingId }: { recordingId: RecordingId }) {
  const [showCopied, setShowCopied] = useState(false);
  const timeoutKey = useRef<NodeJS.Timeout | null>(null);
  const url = `https://app.replay.io/recording/${recordingId}`;

  const onClick = () => {
    navigator.clipboard.writeText(url);
    trackEvent("copy replay link");

    if (timeoutKey.current) {
      clearTimeout(timeoutKey.current);
    }

    setShowCopied(true);
    timeoutKey.current = setTimeout(() => setShowCopied(false), 2000);
  };

  return (
    <div className="copy-link relative flex flex-col items-center flex-shrink-0">
      <button
        className="p-2 py-1 border border-gray-400 rounded-lg hover:bg-primaryAccent hover:border-primaryAccent hover:text-white transition"
        {...{ onClick }}
      >
        Copy Link
      </button>
      {showCopied ? (
        <div className="absolute bottom-full p-1.5 bg-black bg-opacity-900 text-white shadow-2xl rounded-lg mb-1.5">
          Copied
        </div>
      ) : null}
    </div>
  );
}

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
