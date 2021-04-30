import React, { useState } from "react";
import { connect } from "react-redux";
import useToken from "ui/utils/useToken";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import Dropdown from "ui/components/shared/Dropdown";
import "./ShareDropdown.css";

function CopyUrl({ recordingId }) {
  const [copyClicked, setCopyClicked] = useState(false);

  const handleCopyClick = () => {
    navigator.clipboard.writeText(`https://replay.io/view?id=${recordingId}`);
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
        value={`https://replay.io/view?id=${recordingId}`}
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

function Privacy({ isPrivate, toggleIsPrivate }) {
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

function PrivacyNote({ isPrivate, isOwner }) {
  if (!isOwner) {
    return null;
  }

  return (
    <div className={`row privacy-note ${isPrivate ? "is-private" : "is-public"}`}>
      <div style={{ width: "67px" }} />
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

function Collaborators({ setExpanded, recordingId, setModal }) {
  const { token } = useToken();
  if (!token) {
    return null;
  }

  const handleClick = () => {
    setModal("sharing", { recordingId });
    setExpanded(null);
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

function OwnerSettings({ recordingId, isPrivate, isOwner }) {
  const updateIsPrivate = hooks.useToggleIsPrivate(recordingId, isPrivate);

  if (!isOwner) {
    return null;
  }

  return (
    <>
      <Privacy isPrivate={isPrivate} toggleIsPrivate={updateIsPrivate} />
    </>
  );
}

function ShareDropdown({ recordingId, setModal }) {
  const [expanded, setExpanded] = useState(false);
  const isOwner = hooks.useIsOwner(recordingId);
  const { recording } = hooks.useGetRecording(recordingId);

  const isPrivate = recording.private;
  const buttonContent = <div className="img share" />;

  return (
    <div className="share">
      <Dropdown
        buttonContent={buttonContent}
        buttonStyle="secondary"
        setExpanded={setExpanded}
        expanded={expanded}
      >
        <CopyUrl recordingId={recordingId} />
        <OwnerSettings recordingId={recordingId} isPrivate={isPrivate} isOwner={isOwner} />
        <PrivacyNote isPrivate={isPrivate} isOwner={isOwner} />
        <Collaborators recordingId={recordingId} setExpanded={setExpanded} setModal={setModal} />
      </Dropdown>
    </div>
  );
}

export default connect(
  state => ({
    recordingId: selectors.getRecordingId(state),
  }),
  {
    setModal: actions.setModal,
  }
)(ShareDropdown);
