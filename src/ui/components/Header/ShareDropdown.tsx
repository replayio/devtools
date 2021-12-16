import React, { useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import { useGetUserInfo } from "ui/hooks/users";
import {
  useIsOwner,
  useGetRecording,
  useToggleIsPrivate,
  useGetRecordingId,
} from "ui/hooks/recordings";
import { actions } from "ui/actions";
import Dropdown from "ui/components/shared/Dropdown";
import ExternalLink from "../shared/ExternalLink";

function CopyUrl() {
  const recordingId = useGetRecordingId();
  const [copyClicked, setCopyClicked] = useState(false);

  const handleCopyClick = () => {
    navigator.clipboard.writeText(`https://app.replay.io/recording/${recordingId}`);
    setCopyClicked(true);
    setTimeout(() => setCopyClicked(false), 2000);
  };

  if (copyClicked) {
    return (
      <div className="row link">
        <div className="status">
          <div className="success">Link copied</div>
        </div>
      </div>
    );
  }

  return (
    <div className="row link">
      <input
        type="text"
        value={`https://app.replay.io/recording/${recordingId}`}
        onKeyPress={e => e.preventDefault()}
        onChange={e => e.preventDefault()}
      />
      <button onClick={handleCopyClick}>
        <div className="img link" />
        <div className="label">Copy Link</div>
      </button>
    </div>
  );
}

function Privacy({ isPrivate, toggleIsPrivate }: { isPrivate: boolean; toggleIsPrivate(): void }) {
  return (
    <div className="row privacy" onClick={toggleIsPrivate}>
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
  );
}

function PrivacyNote({ isPrivate, isOwner }: { isPrivate: boolean; isOwner: boolean }) {
  if (!isOwner) {
    return null;
  }

  return (
    <div className={`row privacy-note ${isPrivate ? "is-private" : "is-public"}`}>
      <div style={{ width: "52px" }} />
      <div className="label">
        <div className="label-title">Note</div>
        <div className="label-description">
          Replay records everything including passwords you&#39;ve typed and sensitive data
          you&#39;re viewing.{" "}
          <ExternalLink href="https://replayio.notion.site/Sharing-replays-2af70ebdfb1c47e5b9246f25ca377ef2">
            Learn more
          </ExternalLink>
        </div>
      </div>
    </div>
  );
}

function Collaborators({
  setExpanded,
  setModal,
}: PropsFromRedux & { setExpanded(expanded: boolean): void }) {
  const recordingId = useGetRecordingId();
  const { id } = useGetUserInfo();
  if (!id) {
    return null;
  }

  const handleClick = () => {
    setModal("sharing", { recordingId });
    setExpanded(false);
  };

  return (
    <div className="row collaborators">
      <div className="icon img users" />
      <div className="label">
        <div className="label-title">Invite collaborators</div>
        <div className="label-description">Collaborate privately with others</div>
      </div>
      <button className="open-modal" onClick={handleClick}>
        <div className="img invite" />
      </button>
    </div>
  );
}

interface OwnerSettingsProps {
  isPrivate: boolean;
  isOwner: boolean;
}

function OwnerSettings({ isPrivate, isOwner }: OwnerSettingsProps) {
  const recordingId = useGetRecordingId();
  const updateIsPrivate = useToggleIsPrivate(recordingId, isPrivate);

  if (!isOwner) {
    return null;
  }

  return (
    <>
      <Privacy isPrivate={isPrivate} toggleIsPrivate={updateIsPrivate} />
    </>
  );
}

function ShareDropdown({ setModal }: PropsFromRedux) {
  const recordingId = useGetRecordingId();
  const [expanded, setExpanded] = useState(false);
  const isOwner = useIsOwner(recordingId);
  const { recording } = useGetRecording(recordingId);

  const isPrivate = !!recording?.private;
  const buttonContent = <div className="img share" />;

  return (
    <div className="share">
      <Dropdown
        buttonContent={buttonContent}
        buttonStyle="secondary"
        setExpanded={setExpanded}
        expanded={expanded}
      >
        <CopyUrl />
        <OwnerSettings isPrivate={isPrivate} isOwner={isOwner} />
        <PrivacyNote isPrivate={isPrivate} isOwner={isOwner} />
        <Collaborators setExpanded={setExpanded} setModal={setModal} />
      </Dropdown>
    </div>
  );
}

const connector = connect(null, {
  setModal: actions.setModal,
});
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(ShareDropdown);
