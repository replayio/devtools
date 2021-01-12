import React, { useEffect, useState } from "react";

import { connect } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import Avatar from "ui/components/Avatar";
import Title from "ui/components/shared/Title";
import IconWithTooltip from "ui/components/shared/IconWithTooltip";
import ShareDropdown from "ui/components/Header/ShareDropdown";
import ViewToggle from "ui/components/Header/ViewToggle";
import UserOptions from "ui/components/Header/UserOptions";
import "./Header.css";

import { gql, useQuery } from "@apollo/client";
import moment from "moment";

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

function Links({ user, getActiveUsers, recordingId }) {
  return (
    <div className="links">
      <Avatars user={user} getActiveUsers={getActiveUsers} />
      {recordingId ? <ShareDropdown /> : null}
      <ViewToggle />
      <UserOptions />
    </div>
  );
}

function HeaderTitle({ recordingId, editingTitle, setEditingTitle }) {
  const { data, loading } = useQuery(GET_RECORDING_TITLE, {
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
      {!editingTitle && <Subtitle date={date} />}
    </div>
  );
}

function Subtitle({ date }) {
  const [time, setTime] = useState(Date.now());

  // Update the "Created at" time every 30s.
  useEffect(() => {
    const interval = setInterval(() => setTime(Date.now()), 10000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  return <div className="subtitle">Created {moment(date).fromNow()}</div>;
}

function Header({ user, getActiveUsers, recordingId }) {
  const [editingTitle, setEditingTitle] = useState(false);
  const backIcon = <div className="img arrowhead-right" style={{ transform: "rotate(180deg)" }} />;
  const dashboardUrl = `${window.location.origin}/view`;

  const onNavigateBack = event => {
    if (event.metaKey) {
      return window.open(dashboardUrl);
    }
    window.location = dashboardUrl;
  };

  return (
    <div id="header">
      <div className="header-left">
        <IconWithTooltip
          icon={backIcon}
          content={"Back to Dashboard"}
          handleClick={e => onNavigateBack(e)}
        />
        <HeaderTitle
          recordingId={recordingId}
          setEditingTitle={setEditingTitle}
          editingTitle={editingTitle}
        />
      </div>
      <Links user={user} getActiveUsers={getActiveUsers} recordingId={recordingId} />
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
  }
)(Header);
