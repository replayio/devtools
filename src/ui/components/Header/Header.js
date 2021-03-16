import React, { useEffect, useState } from "react";

import { connect } from "react-redux";
import { useAuth0 } from "@auth0/auth0-react";
import { selectors } from "ui/reducers";
import Avatar from "ui/components/Avatar";
import { useGetActiveSessions } from "ui/hooks/sessions";
import Title from "ui/components/shared/Title";
import IconWithTooltip from "ui/components/shared/IconWithTooltip";
import ShareDropdown from "ui/components/Header/ShareDropdown";
import ViewToggle from "ui/components/Header/ViewToggle";
import UserOptions from "ui/components/Header/UserOptions";
import { prefs } from "ui/utils/prefs";

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
      {recordingId ? <ShareDropdown /> : null}
      {!prefs.video && <ViewToggle />}
      <UserOptions />
    </div>
  );
}

function HeaderTitle({ recordingId, editingTitle, setEditingTitle }) {
  const { data } = useQuery(GET_RECORDING_TITLE, {
    variables: { id: recordingId },
  });

  if (!recordingId) {
    return <div className="title">Recordings</div>;
  }

  const { recordingTitle, title, date } = data.recordings?.[0] || {};
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
