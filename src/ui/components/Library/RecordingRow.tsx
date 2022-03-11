import React, { MouseEvent } from "react";
import { Recording } from "ui/types";
import formatDate from "date-fns/format";
import formatDistanceToNow from "date-fns/formatDistanceToNow";
import LazyLoad from "react-lazyload";
import hooks from "ui/hooks";
import { Redacted } from "../Redacted";
import { RecordingId } from "@recordreplay/protocol";
import RecordingOptionsDropdown from "./RecordingOptionsDropdown";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import { getDisplayedUrl } from "ui/utils/environment";
import { getRecordingURL } from "ui/utils/recording";
import styles from "./Library.module.css";

export function getDurationString(durationMs: number) {
  const seconds = Math.round(durationMs / 1000);
  return `${seconds} sec`;
}

export function getRelativeDate(date: string) {
  let content = formatDistanceToNow(new Date(date), { addSuffix: true });

  const daysSince = (new Date().getTime() - new Date(date).getTime()) / (1000 * 3600 * 24);

  // Show relative time if under 3 days, otherwise, use the template below.
  if (daysSince > 2) {
    content = formatDate(new Date(date), "M/d/yyyy");
  }

  return content;
}

function ReplayTitle({ title }: { title?: string }) {
  return (
    <div className={`${styles.replayTitle} overflow-hidden overflow-ellipsis whitespace-pre`}>
      {title || <span className="italic">Untitled</span>}
    </div>
  );
}

function RowWrapper({
  children,
  isEditing,
  recording,
  onClick,
}: {
  children: React.ReactNode;
  isEditing: boolean;
  recording: Recording;
  onClick: () => void;
}) {
  return isEditing ? (
    <div onClick={onClick}> {children}</div>
  ) : (
    <a href={getRecordingURL(recording)} style={{ color: "inherit", textDecoration: "inherit" }}>
      {children}
    </a>
  );
}

type RecordingRowProps = PropsFromRedux & {
  recording: Recording;
  isEditing: boolean;
  selected: boolean;
  addSelectedId: (recordingId: RecordingId) => void;
  removeSelectedId: (recordingId: RecordingId) => void;
};

function RecordingRow({
  recording,
  isEditing,
  selected,
  removeSelectedId,
  addSelectedId,
}: RecordingRowProps) {
  const { userId, loading } = hooks.useGetUserId();
  const isOwner = userId == recording.user?.id;

  const toggleChecked = () => {
    if (selected) {
      removeSelectedId(recording.id);
    } else {
      addSelectedId(recording.id);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <RowWrapper recording={recording} isEditing={isEditing} onClick={toggleChecked}>
      <div
        className={`group flex cursor-pointer flex-row border-b border-themeBorder ${styles.libraryRow}`}
      >
        <div className="flex w-12 flex-shrink-0 flex-row items-center overflow-hidden overflow-ellipsis whitespace-pre py-3 px-4">
          {isEditing && isOwner ? (
            <input
              type="checkbox"
              onClick={e => e.stopPropagation()}
              onChange={toggleChecked}
              checked={selected}
              className="focus:primaryAccentHover h-4 w-4 rounded border-themeBorder text-primaryAccent"
            />
          ) : null}
        </div>
        <div className="flex-grow overflow-hidden overflow-ellipsis whitespace-pre py-3 px-1">
          <div className="flex flex-row items-center space-x-4 overflow-hidden">
            <div className="h-9 w-16 flex-shrink-0 overflow-hidden rounded-sm bg-gray-100">
              <LazyLoad height={36} scrollContainer=".recording-list" once>
                <ItemScreenshot recordingId={recording.id} />
              </LazyLoad>
            </div>

            <div className={`flex flex-col space-y-0.5 overflow-hidden ${styles.recordingTitle}`}>
              <ReplayTitle title={recording.title} />
              <div className="flex flex-row space-x-4 font-light text-gray-400">
                <div
                  className="flex flex-row items-center space-x-1 overflow-hidden overflow-ellipsis whitespace-pre"
                  style={{ minWidth: "5rem" }}
                >
                  <img src="/images/timer.svg" className="w-3" />
                  <span>{getDurationString(recording.duration)}</span>
                </div>
                <div
                  className="flex flex-row items-center space-x-1 overflow-hidden overflow-ellipsis whitespace-pre"
                  style={{ minWidth: "6rem" }}
                >
                  <img src="/images/today.svg" className="w-3" />
                  <span>{getRelativeDate(recording.date)}</span>
                </div>
                <div className="overflow-hidden overflow-ellipsis whitespace-pre font-light text-gray-400">
                  {getDisplayedUrl(recording.url)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="my-auto w-20 min-w-min flex-shrink-0 overflow-hidden overflow-ellipsis whitespace-nowrap py-3 px-3 text-right">
          {recording.private ? "Private" : "Public"}
        </div>
        <div className="my-auto w-36 min-w-0 flex-shrink-0 overflow-hidden overflow-ellipsis whitespace-nowrap py-3 px-3">
          {recording.user ? recording.user.name : "Unknown"}
        </div>
        <div className="flex w-12 flex-shrink-0 flex-row items-center overflow-hidden whitespace-pre py-3 px-3">
          {recording.comments.length ? (
            <div className="inline-block">
              <div className="flex flex-row space-x-1">
                <span>{recording.comments.length}</span>
                <img src="/images/comment-outline.svg" className="w-3" />
              </div>
            </div>
          ) : (
            <div className="flex w-12 flex-shrink-0 flex-row items-center overflow-hidden overflow-ellipsis whitespace-nowrap py-3 px-3" />
          )}
        </div>
        <div
          className="relative flex w-6 flex-shrink-0 flex-row items-center justify-center py-3 pr-4"
          onClick={e => e.stopPropagation()}
        >
          {isOwner && !isEditing ? <RecordingOptionsDropdown {...{ recording }} /> : null}
        </div>
      </div>
    </RowWrapper>
  );
}

function ItemScreenshot({ recordingId }: { recordingId: RecordingId }) {
  const { screenData } = hooks.useGetRecordingPhoto(recordingId);
  return (
    <Redacted>
      <div>{screenData && <img className="h-9 w-full object-contain" src={screenData} />}</div>
    </Redacted>
  );
}

const connector = connect(() => ({}), { loadReplayPrefs: actions.loadReplayPrefs });
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(RecordingRow);
