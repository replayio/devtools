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
import { getUserId } from "ui/utils/useToken";
import { isTest } from "ui/utils/environment";
import ShareButton from "./ShareButton";

import "./Header.css";

import { gql, useQuery } from "@apollo/client";

const GET_RECORDING_TITLE = gql`
  query RecordingTitle($id: uuid!) {
    recordings(where: { id: { _eq: $id } }) {
      id
      title
      date
      recordingTitle
    }
  }
`;

function Avatars({ recordingId, sessionId }) {
  const { users, loading } = useGetActiveSessions(recordingId, sessionId);

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
  const showShare = hooks.useIsOwner(recordingId || "00000000-0000-0000-0000-000000000000");

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
  const userId = getUserId();
  const isAuthor = userId && userId == recording.user_id;
  const { data } = useQuery(GET_RECORDING_TITLE, {
    variables: { id: recordingId },
  });

  if (!recordingId) {
    return <div className="title">Recordings</div>;
  }

  if (loading) {
    return null;
  }

  if (isAuthor && !recording.is_initialized && !isTest()) {
    return (
      <div className="title-container">
        <div className="title">New Recording</div>
      </div>
    );
  }

  const { recordingTitle, title } = data.recordings?.[0] || {};

  return (
    <div className="title-container">
      <Title
        defaultTitle={recordingTitle || title}
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
