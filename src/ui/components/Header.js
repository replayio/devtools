import React, { useEffect, useState } from "react";

import { connect } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import LoginButton from "ui/components/LoginButton";
import Avatar from "ui/components/Avatar";
import Title from "./shared/Title";
import "./Header.css";

import { features } from "ui/utils/prefs";
import { gql, useQuery } from "@apollo/client";

const RECORDING_TITLE = gql`
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
      <Avatar player={firstPlayer} isFirstPlayer={true} />
      {sortedOtherPlayers.map(player => (
        <Avatar player={player} isFirstPlayer={false} key={player.id} />
      ))}
    </div>
  );
}

function Links({ user, getActiveUsers, recordingId, setSharingModal }) {
  return (
    <div className="links">
      <a id="headway" onClick={() => Headway.toggle()}>
        What&apos;s new
      </a>
      {recordingId ? (
        <button className="share" onClick={() => setSharingModal(recordingId)}>
          <div className="img share" />
          <span className="content">Share</span>
        </button>
      ) : null}
      <Avatars user={user} getActiveUsers={getActiveUsers} />
      {features.auth0 ? <LoginButton /> : null}
    </div>
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

function useGetTitle(recordingId) {
  if (!recordingId) {
    return null;
  }

  const { data } = useQuery(RECORDING_TITLE, {
    variables: { recordingId },
  });

  const firstRecording = data?.recordings[0];
  if (!firstRecording) {
    return null;
  }

  return firstRecording.recordingTitle || firstRecording.title;
}

function Header({ user, getActiveUsers, recordingId, setSharingModal }) {
  const [editingTitle, setEditingTitle] = useState(false);
  const defaultTitle = useGetTitle(recordingId);

  useEffect(() => {
    if (typeof Headway === "object") {
      Headway.init(HW_config);
    }
  }, []);

  return (
    <div id="header">
      <Logo />
      {!recordingId ? (
        <div className="title">Recordings</div>
      ) : (
        <Title
          defaultTitle={defaultTitle}
          recordingId={recordingId}
          setEditingTitle={setEditingTitle}
          editingTitle={editingTitle}
        />
      )}
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
