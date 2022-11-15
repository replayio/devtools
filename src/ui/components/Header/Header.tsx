import { RecordingId } from "@replayio/protocol";
import classNames from "classnames/bind";
import React, { useLayoutEffect, useRef, useState } from "react";
import { ConnectedProps, connect } from "react-redux";

import Avatar from "ui/components/Avatar";
import UserOptions from "ui/components/Header/UserOptions";
import ViewToggle, { shouldShowDevToolsNag } from "ui/components/Header/ViewToggle";
import IconWithTooltip from "ui/components/shared/IconWithTooltip";
import hooks from "ui/hooks";
import { useGetActiveSessions } from "ui/hooks/sessions";
import * as selectors from "ui/reducers/app";
import { getViewMode } from "ui/reducers/layout";
import { useAppSelector } from "ui/setup/hooks";
import { UIState } from "ui/state";
import { Recording } from "ui/types";
import { trackEvent } from "ui/utils/telemetry";
import useAuth0 from "ui/utils/useAuth0";

import { RecordingTrialEnd } from "./RecordingTrialEnd";
import ShareButton from "./ShareButton";
import styles from "./Header.module.css";

function pasteText(ev: React.ClipboardEvent) {
  ev.preventDefault();
  var text = ev.clipboardData.getData("text/plain");
  document.execCommand("insertText", false, text);
}

function Avatars({ recordingId }: { recordingId: RecordingId | null }) {
  const { users, loading, error } = useGetActiveSessions(
    recordingId || "00000000-0000-0000-0000-000000000000"
  );

  if (loading || error || !users?.length) {
    return null;
  }

  return (
    <div className={styles.Avatars}>
      {users!.map((player, i) => (
        <Avatar player={player} isFirstPlayer={false} key={i} index={i} />
      ))}
    </div>
  );
}

function Links({ recordingTarget }: Pick<PropsFromRedux, "recordingTarget">) {
  const recordingId = hooks.useGetRecordingId();
  const { isAuthenticated } = useAuth0();
  const { nags } = hooks.useGetUserInfo();

  const viewMode = useAppSelector(getViewMode);

  const showViewToggle = recordingTarget != "node";
  const showDevtoolsNag = showViewToggle && shouldShowDevToolsNag(nags, viewMode);

  const showShareButton = isAuthenticated && !showDevtoolsNag;

  return (
    <div className={styles.Links}>
      <RecordingTrialEnd />
      {showShareButton ? <ShareButton /> : null}
      <Avatars recordingId={recordingId} />
      {showViewToggle && <ViewToggle />}
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
  const inputNode = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(recording?.title ?? "Untitled");
  const updateRecordingTitle = hooks.useUpdateRecordingTitle();
  const canEditTitle = recording.userRole !== "none";
  const isEditing = editing === EditState.Active;

  const className =
    "ml-2 text-lg p-0.5 whitespace-pre overflow-hidden overflow-ellipsis rounded-lg border-transparent hover:border-current focus:border-current";

  const onKeyPress: React.KeyboardEventHandler = (e: any) => {
    if (e.code == "Enter" || e.code == "Escape") {
      e.preventDefault();
      saveOrReset(e.code === "Enter" ? EditState.Saving : EditState.Inactive);
    }
  };
  const onFocus = () => {
    trackEvent("header.edit_title");
    return editing === EditState.Inactive && setEditing(EditState.Active);
  };

  const saveOrReset = (nextState = EditState.Saving) => {
    if (!isEditing) {
      return;
    }

    if (nextState === EditState.Inactive) {
      setTitle(recording.title!);
      setEditing(EditState.Inactive);
    } else if (nextState === EditState.Saving) {
      if (title !== recording.title) {
        const finalTitle = title ?? "Untitled";
        setTitle(finalTitle);
        updateRecordingTitle(recordingId, finalTitle).then(() => {
          setEditing(EditState.Inactive);
        });
        console.log("Saving new title: ", finalTitle);
        setEditing(EditState.Saving);
      } else {
        setEditing(EditState.Inactive);
      }
    }

    inputNode.current!.blur();
  };

  const hasTitle = recording.title && recording.title.length > 0;
  const displayTitle = isEditing ? title : hasTitle ? recording.title : "Untitled";

  useLayoutEffect(() => {
    if (!inputNode.current) {
      return;
    }

    if (!editing) {
      // inputNode.current.value = hasTitle ? recording.title! : "Untitled";
      setTitle(hasTitle ? recording.title! : "Untitled");
    } else if (editing === EditState.Active && !hasTitle) {
      // inputNode.current.value = "";
      setTitle("");
    } else if (editing === EditState.Saving && !inputNode.current.value) {
      // inputNode.current.value = "Untitled";
      setTitle("Untitled");
    }
  }, [editing, hasTitle, recording.title]);

  const testName = recording.metadata?.test?.title;
  if (testName) {
    return <span className={className}>{testName}</span>;
  }

  if (!canEditTitle) {
    return <span className={className}>{displayTitle}</span>;
  }

  return (
    <input
      style={{ outline: "none", background: "inherit", minWidth: 250 }}
      className={classNames(className, "input m-5 focus:bg-blue-500", {
        italic: !hasTitle && !editing,
      })}
      type="text"
      role="textbox"
      spellCheck="false"
      onBlur={() => saveOrReset()}
      onKeyPress={onKeyPress}
      onKeyDown={onKeyPress}
      onFocus={onFocus}
      onPaste={pasteText}
      size={displayTitle?.length ?? 20}
      ref={inputNode}
      value={displayTitle ?? ""}
      onChange={e => {
        console.log("New value: ", e.target.value);
        if (isEditing) {
          setTitle(e.target.value);
        }
      }}
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

  if (loading) {
    return <div className={styles.Header}></div>;
  }

  return (
    <div className={styles.Header}>
      <div className="relative flex flex-grow flex-row items-center overflow-hidden" tabIndex={-1}>
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
          <div className={styles.Title}>Recordings</div>
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
