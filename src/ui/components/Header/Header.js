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
import { isTest } from "ui/utils/test";

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

function Links({ recordingId, sessionId }) {
  return (
    <div className="links">
      <Avatars recordingId={recordingId} sessionId={sessionId} />
      {!prefs.video && <ViewToggle />}
      <UserOptions />
    </div>
  );
}

function HeaderTitle({ recordingId, editingTitle, setEditingTitle }) {
  const { recording } = hooks.useGetRecording(recordingId);
  const userId = getUserId();
  const isAuthor = userId == recording.user_id;
  const { data } = useQuery(GET_RECORDING_TITLE, {
    variables: { id: recordingId },
  });

  if (!recordingId) {
    return <div className="title">Recordings</div>;
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

function Header({ recordingId, sessionId }) {
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
      <Links recordingId={recordingId} sessionId={sessionId} />
    </div>
  );
}

export default connect(state => ({
  recordingId: selectors.getRecordingId(state),
  sessionId: selectors.getSessionId(state),
}))(Header);
