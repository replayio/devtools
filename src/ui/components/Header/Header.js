import React, { useRef, useState } from "react";

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
import IconWithTooltip from "ui/components/shared/IconWithTooltip";

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

// This is a workaround for getting an automatically-resizing horizontal text input
// so that switching between the editing and non-editing states is smoonth.
// https://stackoverflow.com/questions/45306325/react-contenteditable-and-cursor-position
function HeaderTitle({ recording, recordingId }) {
  const [inputValue, setInputValue] = useState(recording.title);
  const inputNode = useRef(null);
  const { userId } = hooks.useGetUserId();
  const updateRecordingTitle = hooks.useUpdateRecordingTitle();
  const isAuthor = userId && userId == recording.userId;

  if (isAuthor && !recording.isInitialized && !isTest()) {
    return (
      <div className="title-container">
        <div className="title">New Recording</div>
      </div>
    );
  }

  const onKeyPress = e => {
    if (e.code == "Enter" || e.code == "Escape") {
      e.preventDefault();
      inputNode.current.blur();
    }
  };
  const onBlur = () => {
    const currentValue = inputNode.current.innerHTML;

    updateRecordingTitle({ variables: { recordingId, title: currentValue } });
    setInputValue(currentValue);
  };

  return (
    <span
      className="input focus:ring-blue-500 ml-2 focus:border-blue-500 text-2xl p-1 bg-transparent w-full border-black"
      role="textbox"
      spellCheck="false"
      contentEditable
      onBlur={onBlur}
      onKeyPress={onKeyPress}
      onKeyDown={onKeyPress}
      dangerouslySetInnerHTML={{ __html: inputValue }}
      ref={inputNode}
    />
  );
}

function Header({ recordingId, sessionId, recordingTarget }) {
  const { recording, loading } = hooks.useGetRecording(recordingId);
  const backIcon = <div className="img arrowhead-right" style={{ transform: "rotate(180deg)" }} />;
  const dashboardUrl = `${window.location.origin}/view`;

  const onNavigateBack = event => {
    if (event.metaKey) {
      return window.open(dashboardUrl);
    }
    window.location = dashboardUrl;
  };

  if (loading) {
    return <div id="header"></div>;
  }

  return (
    <div id="header">
      <div className="header-left">
        <IconWithTooltip
          icon={backIcon}
          content={"Back to Library"}
          handleClick={e => onNavigateBack(e)}
        />
        {recordingId ? (
          <HeaderTitle recording={recording} recordingId={recordingId} />
        ) : (
          <div className="title">Recordings</div>
        )}
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
