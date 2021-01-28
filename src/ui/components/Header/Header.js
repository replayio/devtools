import React, { useEffect, useState } from "react";

import { connect } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import Avatar from "ui/components/Avatar";
import { groupBy } from "lodash";
import { useGetActiveSessions } from "ui/hooks/sessions";
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

function Avatars({ recordingId }) {
  const { data, loading } = useGetActiveSessions(recordingId);

  if (loading) {
    return null;
  }

  const uniqueUsers = groupBy(data.sessions, session => session.user?.auth_id);
  const displayedSessions = Object.keys(uniqueUsers).reduce((acc, key) => {
    if (key == "undefined") {
      return [...acc, ...uniqueUsers[key]];
    }

    return [...acc, uniqueUsers[key][0]];
  }, []);
  const displayedUsers = displayedSessions.map(session => session.user);
  displayedUsers.sort((a, b) => a?.id - b?.id);

  return (
    <div className="avatars">
      {displayedUsers.map((player, i) => (
        <Avatar player={player} isFirstPlayer={false} key={i} index={i} />
      ))}
    </div>
  );
}

function Links({ recordingId }) {
  return (
    <div className="links">
      <Avatars recordingId={recordingId} />
      {recordingId ? <ShareDropdown /> : null}
      <ViewToggle />
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

function Header({ recordingId, sessionId }) {
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
      <Links recordingId={recordingId} />
    </div>
  );
}

export default connect(state => ({
  recordingId: selectors.getRecordingId(state),
}))(Header);
