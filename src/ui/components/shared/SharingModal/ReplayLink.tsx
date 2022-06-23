import React, { useRef, useState } from "react";
import { trackEvent } from "ui/utils/telemetry";
import { getRecordingURL } from "ui/utils/recording";
import { Recording } from "ui/types";

export function CopyButton({ recording }: { recording: Recording }) {
  const [showCopied, setShowCopied] = useState(false);
  const timeoutKey = useRef<NodeJS.Timeout | null>(null);
  const url = window?.location.origin + getRecordingURL(recording);

  const onClick = () => {
    navigator.clipboard.writeText(url);
    trackEvent("share_modal.copy_link");

    if (timeoutKey.current) {
      clearTimeout(timeoutKey.current);
    }

    setShowCopied(true);
    timeoutKey.current = setTimeout(() => setShowCopied(false), 2000);
  };

  return (
    <div className="relative flex flex-col items-center flex-shrink-0 copy-link">
      <button
        className="p-2 py-1 transition border border-gray-400 rounded-lg hover:border-primaryAccent hover:bg-primaryAccent hover:text-white"
        {...{ onClick }}
      >
        Copy Link
      </button>
      {showCopied ? (
        <div className="bg-opacity-900 absolute bottom-full mb-1.5 rounded-lg bg-black p-1.5 text-white shadow-2xl">
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
    <div className="relative flex flex-col items-center copy-link">
      <input
        className="text-sm"
        type="text"
        value={url}
        onKeyPress={e => e.preventDefault()}
        onChange={e => e.preventDefault()}
        onClick={onClick}
      />
      {showCopied ? (
        <div className="bg-opacity-900 absolute bottom-full mb-1.5 rounded-lg bg-black p-1.5 text-white shadow-2xl">
          Copied to Clipboard
        </div>
      ) : null}
    </div>
  );
}
