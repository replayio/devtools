import React, { useLayoutEffect, useRef, useState } from "react";

import { connect, ConnectedProps } from "react-redux";
import * as selectors from "ui/reducers/app";
import Avatar from "ui/components/Avatar";
import { useGetActiveSessions } from "ui/hooks/sessions";
import ViewToggle from "ui/components/Header/ViewToggle";
import UserOptions from "ui/components/Header/UserOptions";
import hooks from "ui/hooks";
import { isDemo } from "ui/utils/environment";
import ShareButton from "./ShareButton";
import useAuth0 from "ui/utils/useAuth0";
import IconWithTooltip from "ui/components/shared/IconWithTooltip";
import { RecordingId } from "@recordreplay/protocol";
import { Recording } from "ui/types";
import { UIState } from "ui/state";

import "./Header.css";
import { Redacted } from "../Redacted";
import classNames from "classnames";
import { RecordingTrialEnd } from "./RecordingTrialEnd";

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
      <RecordingTrialEnd />
      {showShare ? <ShareButton /> : null}
      <Avatars recordingId={recordingId} />
      {recordingTarget != "node" && <ViewToggle />}
      <UserOptions />
    </div>
  );
}

enum EditState {
  Inactive,
  Active,
  Saving,
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
  const [editing, setEditing] = useState(EditState.Inactive);
  const inputNode = useRef<HTMLSpanElement>(null);
  const { userId } = hooks.useGetUserId();
  const updateRecordingTitle = hooks.useUpdateRecordingTitle();
  const isAuthor = userId && userId == recording.userId;

  const className =
    "ml-2 text-lg p-0.5 bg-transparent border-black whitespace-pre overflow-hidden overflow-ellipsis";

  const onKeyPress: React.KeyboardEventHandler = (e: any) => {
    if (e.code == "Enter" || e.code == "Escape") {
      e.preventDefault();
      inputNode.current!.blur();
    }
  };
  const onFocus = () => editing === EditState.Inactive && setEditing(EditState.Active);
  const onBlur = () => {
    if (editing !== EditState.Active) return;
    const currentValue = inputNode.current!.textContent;

    setEditing(EditState.Saving);
    updateRecordingTitle({ variables: { recordingId, title: currentValue } }).then(() => {
      setEditing(EditState.Inactive);
    });
  };

  const hasTitle = recording.title && recording.title.length > 0;
  const displayTitle = hasTitle ? recording.title : "Untitled";

  useLayoutEffect(() => {
    if (!inputNode.current) return;

    if (!editing) {
      inputNode.current.innerText = hasTitle ? recording.title : "Untitled";
    } else if (editing === EditState.Active && !hasTitle) {
      inputNode.current.innerText = "";
    } else if (editing === EditState.Saving && !inputNode.current.innerText) {
      inputNode.current.innerText = "Untitled";
    }
  }, [editing, hasTitle, recording.title]);

  if (!isAuthor) {
    return <span className={className}>{displayTitle}</span>;
  }

  return (
    <span
      className={classNames(className, "input focus:ring-primaryAccent focus:border-blue-500", {
        italic: !hasTitle && !editing,
      })}
      role="textbox"
      spellCheck="false"
      contentEditable
      onBlur={onBlur}
      onKeyPress={onKeyPress}
      onKeyDown={onKeyPress}
      onFocus={onFocus}
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
      <Redacted className="header-left overflow-hidden flex-grow">
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
      </Redacted>
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
