import { RecordingId } from "@replayio/protocol";
import { ClipboardEvent, KeyboardEvent, useLayoutEffect, useRef, useState } from "react";

import { setCursor } from "bvaughn-architecture-demo/components/sources/AutoComplete/utils/contentEditable";
import { RecordingTarget } from "protocol/thread/thread";
import { getRecordingTarget } from "ui/actions/app";
import Avatar from "ui/components/Avatar";
import UserOptions from "ui/components/Header/UserOptions";
import ViewToggle, { shouldShowDevToolsNag } from "ui/components/Header/ViewToggle";
import IconWithTooltip from "ui/components/shared/IconWithTooltip";
import hooks from "ui/hooks";
import { useGetActiveSessions } from "ui/hooks/sessions";
import { getViewMode } from "ui/reducers/layout";
import { useAppSelector } from "ui/setup/hooks";
import { Recording } from "ui/types";
import { trackEvent } from "ui/utils/telemetry";
import useAuth0 from "ui/utils/useAuth0";

import { RecordingTrialEnd } from "./RecordingTrialEnd";
import ShareButton from "./ShareButton";
import styles from "./Header.module.css";

function pasteText(event: ClipboardEvent) {
  event.preventDefault();
  const text = event.clipboardData.getData("text/plain");
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

function Links({ recordingTarget }: { recordingTarget: RecordingTarget | null }) {
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
  Focused,
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
  const [editState, setEditState] = useState(EditState.Inactive);
  const contentEditableRef = useRef<HTMLSpanElement>(null);
  const updateRecordingTitle = hooks.useUpdateRecordingTitle();

  const { metadata, title, userRole } = recording;

  const canEditTitle = userRole !== "none";

  const hasTitle = title && title.length > 0;
  const displayTitle = hasTitle ? title : "Untitled";

  const isMouseDownRef = useRef<boolean>(false);

  useLayoutEffect(() => {
    const contentEditable = contentEditableRef.current;
    if (contentEditable) {
      switch (editState) {
        case EditState.Active: {
          if (!hasTitle) {
            contentEditable.innerText = "";
          }
          break;
        }
        case EditState.Saving: {
          if (!contentEditable.innerText) {
            contentEditable.innerText = "Untitled";
          }
          break;
        }
        default: {
          contentEditable.innerText = hasTitle ? title! : "Untitled";
          break;
        }
      }
    }
  }, [editState, hasTitle, title]);

  const testName = metadata?.test?.title;
  if (testName) {
    return <span className={styles.ReadOnlyTitle}>{testName}</span>;
  } else if (!canEditTitle) {
    return <span className={styles.ReadOnlyTitle}>{displayTitle}</span>;
  }

  const onBlur = () => {
    switch (editState) {
      case EditState.Active: {
        const currentValue = contentEditableRef.current!.textContent || "";

        setEditState(EditState.Saving);
        updateRecordingTitle(recordingId, currentValue).then(() => {
          setEditState(EditState.Inactive);
        });
        break;
      }
      case EditState.Focused: {
        setEditState(EditState.Inactive);
        break;
      }
    }
  };

  const onClick = () => {
    switch (editState) {
      case EditState.Inactive: {
        setEditState(EditState.Focused);
        break;
      }
      case EditState.Focused: {
        setEditState(EditState.Active);

        trackEvent("header.edit_title");
        break;
      }
      default: {
        break;
      }
    }
  };

  const onFocus = () => {
    switch (editState) {
      case EditState.Inactive: {
        if (!isMouseDownRef.current) {
          // If we're focusing because of a "click" event
          // Let the click handler update the focus state
          // Otherwise we'll enter Active mode from a single click
          setEditState(EditState.Focused);
        }
        return true;
      }
      default: {
        break;
      }
    }

    return false;
  };

  const onKeyDownOrKeyPress = (event: KeyboardEvent) => {
    switch (editState) {
      case EditState.Active: {
        if (event.code == "Enter" || event.code == "Escape") {
          event.preventDefault();

          contentEditableRef.current!.blur();
        }
        break;
      }
      case EditState.Focused: {
        if (event.code == "Enter") {
          event.preventDefault();

          setEditState(EditState.Active);
          setCursor(contentEditableRef.current!, title ? title.length : 0);

          trackEvent("header.edit_title");
        }
        break;
      }
    }
  };

  const onMouseDown = () => {
    isMouseDownRef.current = true;
  };

  const onMouseUp = () => {
    isMouseDownRef.current = false;
  };

  return (
    <span
      className={styles.EditableTitle}
      contentEditable={editState === EditState.Active}
      onBlur={onBlur}
      onClick={onClick}
      onFocus={onFocus}
      onKeyDown={onKeyDownOrKeyPress}
      onKeyPress={onKeyDownOrKeyPress}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onPaste={pasteText}
      ref={contentEditableRef}
      role="textbox"
      spellCheck="false"
      tabIndex={0}
    />
  );
}

export default function Header() {
  const recordingTarget = useAppSelector(getRecordingTarget);
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
      <div className="relative flex flex-grow flex-row items-center overflow-hidden">
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
          <div className={styles.ReadOnlyTitle}>Recordings</div>
        )}
      </div>
      <Links recordingTarget={recordingTarget} />
    </div>
  );
}
