import assert from "assert";
import { RecordingId } from "@replayio/protocol";
import classNames from "classnames";
import { useRouter } from "next/router";
import { ClipboardEvent, KeyboardEvent, useLayoutEffect, useRef, useState } from "react";

import { RecordingTarget } from "replay-next/src/suspense/BuildIdCache";
import { Recording } from "shared/graphql/types";
import { getTestRunId } from "shared/test-suites/RecordingTestMetadata";
import { selectAll } from "shared/utils/selection";
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

import { isTestSuiteReplay } from "../TestSuite/utils/isTestSuiteReplay";
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
    <div className={styles.Links} data-test-name="Header">
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

export default function Header() {
  const router = useRouter();
  const recordingTarget = useAppSelector(getRecordingTarget);
  const { isAuthenticated } = useAuth0();
  const recordingId = hooks.useGetRecordingId();
  const { recording, loading } = hooks.useGetRecording(recordingId);
  const backIcon = <div className={classNames(styles.BackButton, "img", "arrowhead-right")} />;

  if (loading) {
    return <div className={styles.Header}></div>;
  }

  assert(recording != null);

  const referrer = Array.isArray(router.query.referrer)
    ? router.query.referrer[0]
    : router.query.referrer;
  let fallbackUrl: string;
  if (referrer) {
    fallbackUrl = referrer;
  } else {
    if (recording.workspace != null) {
      fallbackUrl = `/team/${recording.workspace.id}`;
      if (isTestSuiteReplay(recording) && recording.testRun?.id) {
        fallbackUrl += `/runs/${recording.testRun.id}`;
      }
    } else {
      fallbackUrl = "/team/me/recordings";
    }
  }

  return (
    <div className={styles.Header}>
      <div className="relative flex flex-grow flex-row items-center overflow-hidden">
        {isAuthenticated && (
          <a href={fallbackUrl}>
            <IconWithTooltip icon={backIcon} content={"Back to Library"} />
          </a>
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
