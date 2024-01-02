import React, { useRef, useState } from "react";

import { Recording } from "shared/graphql/types";
import { getRecordingURL } from "shared/utils/recording";
import { trackEvent } from "ui/utils/telemetry";

import Icon from "../../shared/Icon";
import styles from "./SharingModal.module.css";

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
    <div className="copy-link relative flex flex-shrink-0 flex-col items-center">
      <button className={styles.copyURL} {...{ onClick }}>
        <div className="flex">
          <Icon filename="doc" size="medium" className={styles.copyIcon} />
          <div>Copy URL</div>
        </div>
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
    <div className="copy-link relative flex flex-col items-center">
      <input
        className="text-sm"
        type="text"
        value={url}
        onKeyDown={e => e.preventDefault()}
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
