import { RecordingId } from "@replayio/protocol";
import React from "react";
import { getDisplayedUrl } from "ui/utils/environment";
import { Recording } from "ui/types";
import formatDate from "date-fns/format";
import formatDistanceToNow from "date-fns/formatDistanceToNow";
import LazyLoad from "react-lazyload";
import hooks from "ui/hooks";
import { Redacted } from "../../../../../Redacted";
import RecordingOptionsDropdown from "./RecordingOptionsDropdown";
import { getRecordingURL } from "ui/utils/recording";
import styles from "../../../../Library.module.css";
import { useGetUserPermissions } from "ui/hooks/users";
import { TestResult } from "./TestResult";

export function getDurationString(durationMs: number | null | undefined) {
  if (typeof durationMs !== "number") {
    return "";
  }
  const seconds = Math.round(durationMs / 1000);
  return `${seconds} sec`;
}

function shortenRelativeDate(date: string) {
  return date
    .replace("about", "")
    .replace(" hours", "h")
    .replace(" hour", "h")
    .replace(" days", "d")
    .replace(" day", "d")
    .replace(" minutes", "m")
    .replace(" minute", "m")
    .replace(" seconds", "s")
    .replace(" second", "s")
    .replace("less than am", "1m");
}

export function getTruncatedRelativeDate(date: string) {
  return getRelativeDate(date, true);
}

export function getRelativeDate(date: string, truncate: boolean = false) {
  let content = formatDistanceToNow(new Date(date), { addSuffix: true });

  if (truncate) {
    content = shortenRelativeDate(content);
  }

  const daysSince = (new Date().getTime() - new Date(date).getTime()) / (1000 * 3600 * 24);

  // Show relative time if under 2 weeks, otherwise, use the template below.
  if (daysSince > 14) {
    content = formatDate(new Date(date), "M/d/yyyy");
  }

  return content;
}

function ReplayTitle({ title }: { title?: string | null }) {
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

type RecordingRowProps = {
  addSelectedId: (recordingId: RecordingId) => void;
  isEditing: boolean;
  recording: Recording;
  removeSelectedId: (recordingId: RecordingId) => void;
  selected: boolean;
};

function RecordingRow({
  addSelectedId,
  isEditing,
  recording,
  removeSelectedId,
  selected,
}: RecordingRowProps) {
  const { permissions, loading: permissionsLoading } = useGetUserPermissions(recording);
  const allowSelecting =
    isEditing && (permissions.moveToLibrary || permissions.move || permissions.delete);

  const toggleChecked = () => {
    if (!allowSelecting) {
      return;
    }

    if (selected) {
      removeSelectedId(recording.id);
    } else {
      addSelectedId(recording.id);
    }
  };

  if (permissionsLoading) {
    return null;
  }

  return (
    <RowWrapper recording={recording} isEditing={isEditing} onClick={toggleChecked}>
      <div
        className={`group flex cursor-pointer flex-row border-b border-chrome ${styles.libraryRow}`}
      >
        <div className="flex flex-row items-center flex-shrink-0 w-12 px-4 py-3 overflow-hidden whitespace-pre overflow-ellipsis">
          {allowSelecting ? (
            <input
              type="checkbox"
              onClick={e => e.stopPropagation()}
              onChange={toggleChecked}
              checked={selected}
              className="w-4 h-4 rounded focus:primaryAccentHover border-themeBorder text-primaryAccent"
            />
          ) : null}
        </div>
        <div className="flex-grow px-1 py-3 overflow-hidden whitespace-pre overflow-ellipsis">
          <div className="flex flex-row items-center space-x-4 overflow-hidden">
            <div className="flex-shrink-0 w-16 overflow-hidden rounded-sm h-9 bg-chrome">
              <LazyLoad height={36} scrollContainer="#recording-list" once>
                <ItemScreenshot recordingId={recording.id} />
              </LazyLoad>
            </div>

            <div className={`flex flex-col space-y-0.5 overflow-hidden ${styles.recordingTitle}`}>
              <div className="flex items-center space-x-1">
                {recording.metadata?.test ? (
                  <TestResult result={recording.metadata.test.result} />
                ) : null}
                <ReplayTitle title={recording.title} />
              </div>
              <div className="flex flex-row space-x-4 font-light text-gray-400">
                <div
                  className="flex flex-row items-center space-x-1 overflow-hidden whitespace-pre overflow-ellipsis"
                  style={{ minWidth: "5rem" }}
                >
                  <img src="/images/timer.svg" className="w-3" />
                  <span>{getDurationString(recording.duration)}</span>
                </div>
                <div
                  className="flex flex-row items-center space-x-1 overflow-hidden whitespace-pre overflow-ellipsis"
                  style={{ minWidth: "6rem" }}
                >
                  <img src="/images/today.svg" className="w-3" />
                  <span>{getRelativeDate(recording.date)}</span>
                </div>
                <div className="overflow-hidden font-light text-gray-400 whitespace-pre overflow-ellipsis">
                  {getDisplayedUrl(recording.url)}
                </div>
                {recording.metadata?.test?.file ? (
                  <div className="overflow-hidden font-light text-gray-400 whitespace-pre overflow-ellipsis">
                    {recording.metadata.test.file}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 w-20 px-3 py-3 my-auto overflow-hidden text-right min-w-min overflow-ellipsis whitespace-nowrap">
          {recording.private ? "Private" : "Public"}
        </div>
        <div className="flex-shrink-0 min-w-0 px-3 py-3 my-auto overflow-hidden w-36 overflow-ellipsis whitespace-nowrap">
          {recording.user ? recording.user.name : "Unknown"}
        </div>
        <div className="flex flex-row items-center flex-shrink-0 w-12 px-3 py-3 overflow-hidden whitespace-pre">
          {recording.comments.length ? (
            <div className="inline-block">
              <div className="flex flex-row space-x-1">
                <span>{recording.comments.length}</span>
                <img src="/images/comment-outline.svg" className="w-3" />
              </div>
            </div>
          ) : (
            <div className="flex flex-row items-center flex-shrink-0 w-12 px-3 py-3 overflow-hidden overflow-ellipsis whitespace-nowrap" />
          )}
        </div>
        <div
          className="relative flex flex-row items-center justify-center flex-shrink-0 w-6 py-3 pr-4"
          onClick={e => e.stopPropagation()}
        >
          {!isEditing ? <RecordingOptionsDropdown {...{ recording }} /> : null}
        </div>
      </div>
    </RowWrapper>
  );
}

export function ItemScreenshot({ recordingId }: { recordingId: RecordingId }) {
  const { screenData } = hooks.useGetRecordingPhoto(recordingId);
  return (
    <Redacted>
      <div>{screenData && <img className="object-contain w-full h-9" src={screenData} />}</div>
    </Redacted>
  );
}

export default RecordingRow;
