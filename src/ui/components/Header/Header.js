import React, { useEffect, useState } from "react";

import { connect } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import Avatar from "ui/components/Avatar";
import Title from "ui/components/shared/Title";
import ShareDropdown from "ui/components/Header/ShareDropdown";
import UserOptions from "ui/components/Header/UserOptions";
import "./Header.css";

import { gql, useQuery, useMutation } from "@apollo/client";

const GET_RECORDING_TITLE = gql`
  query RecordingTitle($recordingId: String) {
    recordings(where: { recording_id: { _eq: $recordingId } }) {
      id
      title
      recordingTitle
    }
  }
`;

function Avatars({ user, getActiveUsers }) {
  const activeUsers = getActiveUsers();
  const firstPlayer = user;
  const otherPlayers = activeUsers.filter(user => user.id != firstPlayer.id);

  // We sort the other players by ID here to prevent them from shuffling.
  const sortedOtherPlayers = otherPlayers.sort((a, b) => a.id - b.id);

  return (
    <div className="avatars">
      {sortedOtherPlayers.map(player => (
        <Avatar player={player} isFirstPlayer={false} key={player.id} />
      ))}
    </div>
  );
}

function Links({ user, getActiveUsers, recordingId, setSharingModal }) {
  return (
    <div className="links">
      <Avatars user={user} getActiveUsers={getActiveUsers} />
      {recordingId ? <ShareDropdown /> : null}
      <UserOptions />
    </div>
  );
}

function HeaderTitle({ recordingId, editingTitle, setEditingTitle }) {
  const { data } = useQuery(GET_RECORDING_TITLE, {
    variables: { recordingId },
  });

  if (!recordingId) {
    return <div className="title">Recordings</div>;
  }

  const recording = data.recordings[0];
  const { recordingTitle, title } = recording || {};

  return (
    <Title
      defaultTitle={recordingTitle || title}
      setEditingTitle={setEditingTitle}
      editingTitle={editingTitle}
    />
  );
}

function Logo() {
  return (
    <>
      <a href="/view">
        <div className="logo" />
      </a>
      <div id="status" />
    </>
  );
}

function Header({ user, getActiveUsers, recordingId, setSharingModal }) {
  const [editingTitle, setEditingTitle] = useState(false);

  return (
    <div id="header">
      <Logo />
      <HeaderTitle
        recordingId={recordingId}
        setEditingTitle={setEditingTitle}
        editingTitle={editingTitle}
      />
      <Links
        user={user}
        getActiveUsers={getActiveUsers}
        recordingId={recordingId}
        setSharingModal={setSharingModal}
      />
    </div>
  );
}

export default connect(
  state => ({
    user: selectors.getUser(state),
    recordingId: selectors.getRecordingId(state),
  }),
  {
    getActiveUsers: actions.getActiveUsers,
    setSharingModal: actions.setSharingModal,
  }
)(Header);
