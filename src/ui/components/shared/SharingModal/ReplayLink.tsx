import React, { useRef, useState } from "react";

import { Recording } from "shared/graphql/types";
import { getRecordingURL } from "shared/utils/recording";
import { trackEvent } from "ui/utils/telemetry";

import Icon from "../../shared/Icon";

export function CopyButton({ recording }: { recording: Recording }) {
  const [showCopied, setShowCopied] = useState(false);
  const timeoutKey = useRef<NodeJS.Timeout | null>(null);
  const url = window?.location.origin + getRecordingURL(recording, true);

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
    <div className="copy-link relative flex w-full flex-col items-stretch">
      <button
        type="button"
        onClick={onClick}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Icon className="h-4 w-4 shrink-0 bg-muted-foreground" filename="doc" size="small" />
        <span>Copy URL</span>
      </button>
      {showCopied ? (
        <div
          role="status"
          className="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-md border border-border bg-popover px-2 py-1.5 text-xs text-popover-foreground shadow-md"
        >
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
    <div className="relative flex w-full flex-col items-stretch">
      <input
        className="w-full cursor-pointer rounded-lg border border-border bg-background px-2 py-2 text-sm text-foreground"
        type="text"
        readOnly
        value={url}
        onKeyDown={e => e.preventDefault()}
        onChange={e => e.preventDefault()}
        onClick={onClick}
      />
      {showCopied ? (
        <div
          role="status"
          className="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-md border border-border bg-popover px-2 py-1.5 text-xs text-popover-foreground shadow-md"
        >
          Copied to Clipboard
        </div>
      ) : null}
    </div>
  );
}
