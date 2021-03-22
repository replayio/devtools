import React from "react";
import hooks from "ui/hooks";
import "./RecordingPrivacy.css";

function PrivacyNote({ isPrivate }: { isPrivate: boolean }) {
  return (
    <div className={`privacy-note ${isPrivate ? "is-private" : "is-public"}`}>
      <div className="label">
        <div className="label-title">Note</div>
        <div className="label-description">
          Replay records everything including passwords you&#39;ve typed and sensitive data
          you&#39;re viewing.{" "}
          <a
            target="_blank"
            rel="noreferrer"
            href="https://www.notion.so/replayio/Security-2af70ebdfb1c47e5b9246f25ca377ef2"
          >
            Learn more
          </a>
        </div>
      </div>
    </div>
  );
}

export default function RecordingPrivacy({ recordingId }: { recordingId: string }) {
  const { isPrivate } = hooks.useGetIsPrivate(recordingId);
  const updateIsPrivate = hooks.useUpdateIsPrivate(recordingId, isPrivate);

  const toggleIsPrivate = () => {
    updateIsPrivate();
  };

  return (
    <div className="privacy-toggle-container">
      <div className="privacy-toggle" onClick={toggleIsPrivate}>
        <div className={`icon img ${isPrivate ? "locked" : "unlocked"}`} />
        {isPrivate ? (
          <div className="label">
            <div className="label-title">Private</div>
            <div className="label-description">Only you and your collaborators can view</div>
          </div>
        ) : (
          <div className="label">
            <div className="label-title">Public</div>
            <div className="label-description">Anyone with this link can view</div>
          </div>
        )}
        <button className={`toggle ${isPrivate ? "off" : "on"}`}>
          <div className="switch" />
        </button>
      </div>
      <PrivacyNote isPrivate={isPrivate} />
    </div>
  );
}
