import { RecordingId } from "@replayio/protocol";
import { ClipboardEvent, KeyboardEvent, useLayoutEffect, useRef, useState } from "react";
import { ConnectedProps, connect } from "react-redux";

import { RecordingTarget } from "protocol/thread/thread";
import { Recording } from "shared/graphql/types";
import { selectAll } from "shared/utils/selection";
import { toggleReplayAssist } from "ui/actions/app";
import { getRecordingTarget } from "ui/actions/app";
import Avatar from "ui/components/Avatar";
import UserOptions from "ui/components/Header/UserOptions";
import ViewToggle, { shouldShowDevToolsNag } from "ui/components/Header/ViewToggle";
import IconWithTooltip from "ui/components/shared/IconWithTooltip";
import hooks from "ui/hooks";
import { useGetActiveSessions } from "ui/hooks/sessions";
import { getViewMode } from "ui/reducers/layout";
import { useAppSelector } from "ui/setup/hooks";
import { trackEvent } from "ui/utils/telemetry";
import useAuth0 from "ui/utils/useAuth0";

import { RecordingTrialEnd } from "./RecordingTrialEnd";
import ShareButton from "./ShareButton";
import styles from "./Header.module.css";

const mapDispatchToProps = { toggleReplayAssist };

const connector = connect(null, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;

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
    <div className={styles.Links} data-test-name="Header">
      <RecordingTrialEnd />
      {showShareButton ? <ShareButton /> : null}
      <Avatars recordingId={recordingId} />
      {showViewToggle && <ViewToggle />}
      <UserOptions toggleReplayAssist={toggleReplayAssist} />
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
  const [editState, setEditState] = useState(EditState.Inactive);
  const contentEditableRef = useRef<HTMLSpanElement>(null);
  const updateRecordingTitle = hooks.useUpdateRecordingTitle();

  const { title, userRole } = recording;

  const canEditTitle = userRole !== "none";
  const hasTitle = title && title.length > 0;
  const displayTitle = hasTitle ? title : "Untitled";

  useLayoutEffect(() => {
    if (!contentEditableRef.current) {
      return;
    }

    if (!editState) {
      contentEditableRef.current.innerText = hasTitle ? title! : "Untitled";
    } else if (editState === EditState.Active && !hasTitle) {
      contentEditableRef.current.innerText = "";
    } else if (editState === EditState.Saving && !contentEditableRef.current.innerText) {
      contentEditableRef.current.innerText = "Untitled";
    }
  }, [editState, hasTitle, title]);

  if (!canEditTitle) {
    return (
      <span className={styles.ReadOnlyTitle} data-testid="Header-Title">
        {displayTitle}
      </span>
    );
  }

  const onKeyDownOrKeyPress = (event: KeyboardEvent) => {
    if (event.code == "Enter" || event.code == "Escape") {
      event.preventDefault();
      contentEditableRef.current!.blur();
    }
  };
  const onFocus = () => {
    trackEvent("header.edit_title");
    setEditState(EditState.Active);

    const contentEditable = contentEditableRef.current;
    if (contentEditable) {
      selectAll(contentEditable);
    }
  };
  const onBlur = () => {
    const contentEditable = contentEditableRef.current;
    if (editState !== EditState.Active || !contentEditable) {
      return;
    }
    const currentValue = contentEditable.textContent || "";

    setEditState(EditState.Saving);
    updateRecordingTitle(recordingId, currentValue).then(() => {
      setEditState(EditState.Inactive);
    });
  };

  return (
    <span
      data-testid="Header-Title"
      className={styles.EditableTitle}
      contentEditable
      onBlur={onBlur}
      onFocus={onFocus}
      onKeyDown={onKeyDownOrKeyPress}
      onKeyPress={onKeyDownOrKeyPress}
      onPaste={pasteText}
      ref={contentEditableRef}
      role="textbox"
      spellCheck="false"
      tabIndex={0}
    />
  );
}

interface HeaderProps extends PropsFromRedux {}

function Header({ toggleReplayAssist }: HeaderProps) {
  const recordingTarget = useAppSelector(getRecordingTarget);
  const { isAuthenticated } = useAuth0();
  const recordingId = hooks.useGetRecordingId();
  const { recording, loading } = hooks.useGetRecording(recordingId);
  const backIcon = <div className="img arrowhead-right" style={{ transform: "rotate(180deg)" }} />;
  const dashboardUrl = window.location.origin;

  const onNavigateBack: React.MouseEventHandler = event => {
    if (event.metaKey) {
      return window.open(dashboardUrl, "library-tab");
    }
    window.open(dashboardUrl, "library-tab");
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
        <div className="flex-grow">&nbsp;</div>
      </div>
      <Links recordingTarget={recordingTarget} />
    </div>
  );
}

const ConnectedHeader = connector(Header);
export default ConnectedHeader;
