import React, { useState } from "react";

import { connect } from "react-redux";
import { selectors } from "ui/reducers";
import Avatar from "ui/components/Avatar";
import { useGetActiveSessions } from "ui/hooks/sessions";
import Title from "ui/components/shared/Title";
import ViewToggle from "ui/components/Header/ViewToggle";
import UserOptions from "ui/components/Header/UserOptions";
import { prefs } from "ui/utils/prefs";
import hooks from "ui/hooks";
import { isTest } from "ui/utils/environment";
import ShareButton from "./ShareButton";
import useAuth0 from "ui/utils/useAuth0";

import "./Header.css";

function Avatars({ recordingId, sessionId }) {
  const { users, loading } = useGetActiveSessions(recordingId);

  if (loading) {
    return null;
  }

  return (
    <div className="avatars">
      {users.map((player, i) => (
        <Avatar player={player} isFirstPlayer={false} key={i} index={i} />
      ))}
    </div>
  );
}

function Links({ recordingId, sessionId, recordingTarget }) {
  const { isAuthenticated } = useAuth0();
  const isOwner = hooks.useIsOwner(recordingId || "00000000-0000-0000-0000-000000000000");
  const isCollaborator =
    isAuthenticated &&
    hooks.useIsCollaborator(recordingId || "00000000-0000-0000-0000-000000000000");
  const showShare = isOwner || isCollaborator;

  return (
    <div className="links">
      {showShare ? <ShareButton /> : null}
      <Avatars recordingId={recordingId} sessionId={sessionId} />
      {!prefs.video && recordingTarget != "node" && <ViewToggle />}
      <UserOptions />
    </div>
  );
}

function HeaderTitle({ recordingId, editingTitle, setEditingTitle }) {
  const { recording, loading } = hooks.useGetRecording(recordingId);
  const { userId } = hooks.useGetUserId();
  const isAuthor = userId && userId == recording.userId;

  if (!recordingId) {
    return <div className="title">Recordings</div>;
  }

  if (loading) {
    return null;
  }

  if (isAuthor && !recording.isInitialized && !isTest()) {
    return (
      <div className="title-container">
        <div className="title">New Recording</div>
      </div>
    );
  }

  const { title } = recording || {};

  return (
    <div className="title-container">
      <Title
        defaultTitle={title}
        setEditingTitle={setEditingTitle}
        editingTitle={editingTitle}
        recordingId={recordingId}
        allowEditOnTitleClick={true}
      />
    </div>
  );
}

function Header({ recordingId, sessionId, recordingTarget }) {
  const [editingTitle, setEditingTitle] = useState(false);

  return (
    <div id="header">
      <div className="header-left">
        <HeaderTitle
          recordingId={recordingId}
          setEditingTitle={setEditingTitle}
          editingTitle={editingTitle}
        />
      </div>
      <Links recordingId={recordingId} sessionId={sessionId} recordingTarget={recordingTarget} />
    </div>
  );
}

export default connect(state => ({
  recordingId: selectors.getRecordingId(state),
  sessionId: selectors.getSessionId(state),
  recordingTarget: selectors.getRecordingTarget(state),
}))(Header);
