import React, { useRef, useState } from "react";

import { connect, ConnectedProps } from "react-redux";
import * as selectors from "ui/reducers/app";
import Avatar from "ui/components/Avatar";
import { useGetActiveSessions } from "ui/hooks/sessions";
import ViewToggle from "ui/components/Header/ViewToggle";
import UserOptions from "ui/components/Header/UserOptions";
import hooks from "ui/hooks";
import { isDemo, isTest } from "ui/utils/environment";
import ShareButton from "./ShareButton";
import useAuth0 from "ui/utils/useAuth0";
import IconWithTooltip from "ui/components/shared/IconWithTooltip";
import { RecordingId } from "@recordreplay/protocol";
import { Recording } from "ui/types";
import { UIState } from "ui/state";

import "./Header.css";

function Avatars({ recordingId }: { recordingId: RecordingId | null }) {
  const { users, loading, error } = useGetActiveSessions(
    recordingId || "00000000-0000-0000-0000-000000000000"
  );

  if (loading || error) {
    return null;
  }

  return (
    <div className="avatars">
      {users!.map((player, i) => (
        <Avatar player={player} isFirstPlayer={false} key={i} index={i} />
      ))}
    </div>
  );
}

function Links({ recordingTarget }: Pick<PropsFromRedux, "recordingTarget">) {
  const recordingId = hooks.useGetRecordingId();
  const { isAuthenticated } = useAuth0();
  const isOwner = hooks.useIsOwner(recordingId || "00000000-0000-0000-0000-000000000000");
  const isCollaborator =
    isAuthenticated &&
    hooks.useIsCollaborator(recordingId || "00000000-0000-0000-0000-000000000000");
  const showShare = isOwner || isCollaborator;

  return (
    <div className="links">
      {showShare ? <ShareButton /> : null}
      <Avatars recordingId={recordingId} />
      {recordingTarget != "node" && <ViewToggle />}
      <UserOptions />
    </div>
  );
}

// This is a workaround for getting an automatically-resizing horizontal text input
// so that switching between the editing and non-editing states is smooth.
// https://stackoverflow.com/questions/45306325/react-contenteditable-and-cursor-position
function HeaderTitle({
  recording,
  recordingId,
}: {
  recording: Recording;
  recordingId: RecordingId;
}) {
  const [inputValue, setInputValue] = useState(recording.title);
  const inputNode = useRef<HTMLSpanElement>(null);
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

  const onKeyPress: React.KeyboardEventHandler = (e: any) => {
    if (e.code == "Enter" || e.code == "Escape") {
      e.preventDefault();
      inputNode.current!.blur();
    }
  };
  const onBlur = () => {
    const currentValue = inputNode.current!.innerHTML;

    updateRecordingTitle({ variables: { recordingId, title: currentValue } });
    setInputValue(currentValue);
  };

  return (
    <span
      className="input focus:ring-primaryAccent ml-2 focus:border-blue-500 text-lg p-0.5 bg-transparent border-black whitespace-pre overflow-hidden overflow-ellipsis inter"
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

function Header({ recordingTarget }: PropsFromRedux) {
  const { isAuthenticated } = useAuth0();
  const recordingId = hooks.useGetRecordingId();
  const { recording, loading } = hooks.useGetRecording(recordingId);
  const backIcon = <div className="img arrowhead-right" style={{ transform: "rotate(180deg)" }} />;
  const dashboardUrl = window.location.origin;

  const onNavigateBack: React.MouseEventHandler = event => {
    if (event.metaKey) {
      return window.open(dashboardUrl);
    }
    window.location.href = dashboardUrl;
  };

  if (isDemo()) {
    return <div id=""></div>;
  }
  if (loading) {
    return <div id="header"></div>;
  }

  return (
    <div id="header">
      <div className="header-left overflow-hidden flex-grow">
        {isAuthenticated && (
          <IconWithTooltip
            icon={backIcon}
            content={"Back to Library"}
            handleClick={e => onNavigateBack(e)}
          />
        )}
        {recording && recordingId ? (
          <HeaderTitle recording={recording} recordingId={recordingId} />
        ) : (
          <div className="title">Recordings</div>
        )}
      </div>
      <Links recordingTarget={recordingTarget} />
    </div>
  );
}

const connector = connect((state: UIState) => ({
  sessionId: selectors.getSessionId(state),
  recordingTarget: selectors.getRecordingTarget(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(Header);
